import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Helpers ────────────────────────────────────────────────────────────────

// Un ticker est considéré comme "US" (géré par Finnhub) s'il ne porte pas
// de suffixe boursier européen (.PA, .DE, .L, .MC, .AS, .SW, .BR, .MI, etc.).
// Yahoo Finance est utilisé pour tous les autres.
const SUFFIXES_NON_US = ['.PA', '.DE', '.L', '.MC', '.AS', '.SW', '.BR', '.MI', '.NX', '.TO', '.AX', '.HK']

function estTickerUS(ticker: string): boolean {
  const upper = ticker.toUpperCase()
  return !SUFFIXES_NON_US.some(sfx => upper.endsWith(sfx))
}

// Yahoo Finance ne retourne pas de CORS headers exploitables côté navigateur,
// mais depuis une Edge Function (serveur) on peut l'appeler directement.
// On essaie query1 puis query2 (les deux hôtes de l'API chart de Yahoo).
async function fetchYahooQuote(ticker: string): Promise<{ prix: number; variation: number | null } | null> {
  const symbole = encodeURIComponent(ticker)
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']
  for (const host of hosts) {
    try {
      // v8/chart spark → snapshot récent sans la lourdeur de v7/quote.
      const url = `https://${host}/v8/finance/chart/${symbole}?interval=1d&range=5d`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Fondora price updater)' },
      })
      if (!res.ok) continue
      const json = await res.json()
      const result = json?.chart?.result?.[0]
      if (!result) continue
      const close = result?.indicators?.quote?.[0]?.close?.filter(Boolean) ?? []
      if (close.length === 0) continue
      const prix = close[close.length - 1] as number
      const variation = close.length >= 2
        ? (((prix - (close[close.length - 2] as number)) / (close[close.length - 2] as number)) * 100)
        : null
      if (typeof prix === 'number' && prix > 0) {
        return { prix, variation }
      }
    } catch {
      // hôte suivant
    }
  }
  return null
}

async function fetchFinnhubQuote(ticker: string): Promise<{ prix: number; variation: number | null } | null> {
  if (!FINNHUB_KEY) return null
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_KEY}`
    )
    const data = await res.json()
    if (data && typeof data.c === 'number' && data.c > 0) {
      const variation = (typeof data.dp === 'number') ? data.dp : null
      return { prix: data.c, variation }
    }
  } catch {
    // ignore
  }
  return null
}

// ── Point d'entrée ─────────────────────────────────────────────────────────

serve(async () => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
  const now = new Date().toISOString()
  let totalMisAJour = 0

  // ── 1. Actions & ETF via Finnhub (US) / Yahoo (non-US) ──────────────────
  const { data: actifs } = await supabase
    .from('catalogue_actifs')
    .select('ticker, devise')

  if (actifs && actifs.length > 0) {
    // Séparation US / non-US pour appliquer la bonne source et le bon rythme.
    const us = actifs.filter(a => estTickerUS(a.ticker))
    const nonUs = actifs.filter(a => !estTickerUS(a.ticker))

    // Finnhub : séquentiel, 25 par run, délai 1.1s (limite gratuite 60 req/min).
    for (let i = 0; i < Math.min(us.length, 25); i++) {
      const actif = us[i]
      const quote = await fetchFinnhubQuote(actif.ticker)
      if (quote) {
        const { error } = await supabase.from('asset_prices_cache').upsert({
          symbole: actif.ticker.toUpperCase(),
          prix_actuel: quote.prix,
          variation_24h: quote.variation,
          devise: actif.devise || 'EUR',
          updated_at: now,
        }, { onConflict: 'symbole' })
        if (!error) totalMisAJour++
      }
      await sleep(1100)
    }

    // Yahoo : séquentiel, 45-50 par run, délai 500ms, retry query1/query2.
    for (let i = 0; i < Math.min(nonUs.length, 50); i++) {
      const actif = nonUs[i]
      const quote = await fetchYahooQuote(actif.ticker)
      if (quote) {
        const { error } = await supabase.from('asset_prices_cache').upsert({
          symbole: actif.ticker.toUpperCase(),
          prix_actuel: quote.prix,
          variation_24h: quote.variation,
          devise: actif.devise || 'EUR',
          updated_at: now,
        }, { onConflict: 'symbole' })
        if (!error) totalMisAJour++
      }
      await sleep(500)
    }
  }

  // ── 2. Crypto via CoinGecko (sans clé API) ─────────────────────────────
  const { data: cryptos } = await supabase
    .from('catalogue_crypto')
    .select('symbole, coingecko_id')
    .not('coingecko_id', 'is', null)

  if (cryptos && cryptos.length > 0) {
    // CoinGecko accepte jusqu'à 250 IDs par appel.
    for (let i = 0; i < cryptos.length; i += 250) {
      const lot = cryptos.slice(i, i + 250)
      const ids = lot.map(c => c.coingecko_id).join(',')

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`
        )
        const data = await res.json()

        for (const crypto of lot) {
          const entry = data[crypto.coingecko_id]
          const prix = entry?.eur
          const variation = (typeof entry?.eur_24h_change === 'number') ? entry.eur_24h_change : null
          if (typeof prix === 'number' && prix > 0) {
            const symbole = (crypto.symbole || '').toUpperCase()
            if (!symbole) continue
            const { error } = await supabase.from('asset_prices_cache').upsert({
              symbole,
              prix_actuel: prix,
              variation_24h: variation,
              devise: 'EUR',
              updated_at: now,
            }, { onConflict: 'symbole' })
            if (!error) totalMisAJour++
          }
        }
      } catch (e) {
        console.error('Erreur CoinGecko:', e)
      }

      if (i + 250 < cryptos.length) await sleep(2000)
    }
  }

  return new Response(
    JSON.stringify({ success: true, mis_a_jour: totalMisAJour, date: now }),
    { headers: { "Content-Type": "application/json" } }
  )
})
