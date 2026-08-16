import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const TTL_MINUTES = 90

// Suffixes boursiers non-US : Yahoo Finance est la source fiable pour ceux-ci,
// Finnhub ne supportant que les tickers US.
const SUFFIXES_NON_US = ['.PA', '.DE', '.L', '.MC', '.AS', '.SW', '.BR', '.MI', '.NX', '.TO', '.AX', '.HK']

function estTickerUS(ticker: string): boolean {
    const upper = ticker.toUpperCase()
    return !SUFFIXES_NON_US.some(sfx => upper.endsWith(sfx))
}

// Yahoo Finance v8/chart : snapshot récent (dernier cours + variation).
// Retry sur query1 puis query2 (les deux hôtes de l'API chart de Yahoo).
async function fetchYahooQuote(ticker: string): Promise<{ prix: number; variation: number | null } | null> {
    const symbole = encodeURIComponent(ticker)
    const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']
    for (const host of hosts) {
        try {
            const url = `https://${host}/v8/finance/chart/${symbole}?interval=1d&range=5d`
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Fondora cours-bourse)' },
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
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`)
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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { symbole } = await req.json()
        if (!symbole) {
            return new Response(JSON.stringify({ error: 'Symbole manquant' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const ticker = String(symbole).toUpperCase()
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Vérifier le cache
        const { data: cacheData } = await supabase
            .from('asset_prices_cache')
            .select('symbole, prix_actuel, variation_24h, devise, updated_at')
            .eq('symbole', ticker)
            .maybeSingle()

        if (cacheData) {
            const ageMinutes = (Date.now() - new Date(cacheData.updated_at).getTime()) / 60000
            if (ageMinutes < TTL_MINUTES) {
                return new Response(JSON.stringify({
                    symbole: ticker,
                    coursActuel: cacheData.prix_actuel,
                    variation: cacheData.variation_24h,
                    devise: cacheData.devise || 'EUR',
                    source: 'cache',
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // 2. Lookup de la devise réelle dans le catalogue (plus fiable que de deviner)
        const { data: catalogueData } = await supabase
            .from('catalogue_actifs')
            .select('devise')
            .eq('ticker', ticker)
            .maybeSingle()

        const deviseResolue = catalogueData?.devise || cacheData?.devise || 'EUR'

        // 3. Cache absent ou expiré → appel API.
        //    Finnhub pour les tickers US, Yahoo pour les non-US (.PA, .DE, .L…).
        const estUS = estTickerUS(ticker)
        const quote = estUS
            ? await fetchFinnhubQuote(ticker)
            : await fetchYahooQuote(ticker)

        // Fallback croisé : si la source principale échoue, on tente l'autre.
        // (Utile pour les tickers US listés aussi à l'étranger, et vice-versa.)
        const quoteFinal = quote ?? (estUS ? await fetchYahooQuote(ticker) : await fetchFinnhubQuote(ticker))

        if (!quoteFinal) {
            if (cacheData) {
                return new Response(JSON.stringify({
                    symbole: ticker,
                    coursActuel: cacheData.prix_actuel,
                    devise: cacheData.devise || 'EUR',
                    source: 'cache_expire_fallback',
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            return new Response(JSON.stringify({ error: 'Cours indisponible pour ce symbole' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Mise à jour du cache avec la devise résolue
        await supabase.from('asset_prices_cache').upsert({
            symbole: ticker,
            prix_actuel: quoteFinal.prix,
            variation_24h: quoteFinal.variation,
            devise: deviseResolue,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'symbole' })

        return new Response(JSON.stringify({
            symbole: ticker,
            coursActuel: quoteFinal.prix,
            variation: quoteFinal.variation,
            devise: deviseResolue,
            source: estUS ? 'finnhub' : 'yahoo',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
