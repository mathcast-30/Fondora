import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

serve(async () => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().split('T')[0];
  let totalMisAJour = 0;

  // ── 1. ACTIONS & ETF via Finnhub ──────────────────────────────
  const { data: actifs } = await supabase
    .from('catalogue_actifs')
    .select('id, ticker');

  if (actifs && actifs.length > 0) {
    // Traitement par lots de 50 avec pause de 1s entre chaque lot
    for (let i = 0; i < actifs.length; i += 50) {
      const lot = actifs.slice(i, i + 50);
      
      await Promise.all(lot.map(async (actif) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${actif.ticker}&token=${FINNHUB_KEY}`
          );
          const data = await res.json();
          
          if (data.c && data.c > 0) {
            await supabase.from('historique_prix_actifs').upsert({
              actif_id: actif.id,
              date: today,
              prix_cloture: data.c
            }, { onConflict: 'actif_id,date' });
            totalMisAJour++;
          }
        } catch (e) {
          console.error(`Erreur ${actif.ticker}:`, e);
        }
      }));

      // Pause entre les lots pour ne pas dépasser 60 req/min
      if (i + 50 < actifs.length) await sleep(1000);
    }
  }

  // ── 2. CRYPTO via CoinGecko (sans clé API) ───────────────────
  const { data: cryptos } = await supabase
    .from('catalogue_crypto')
    .select('id, coingecko_id')
    .not('coingecko_id', 'is', null);

  if (cryptos && cryptos.length > 0) {
    // CoinGecko accepte jusqu'à 250 IDs par appel
    for (let i = 0; i < cryptos.length; i += 250) {
      const lot = cryptos.slice(i, i + 250);
      const ids = lot.map(c => c.coingecko_id).join(',');

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
        );
        const data = await res.json();

        await Promise.all(lot.map(async (crypto) => {
          const prix = data[crypto.coingecko_id]?.eur;
          if (prix) {
            await supabase.from('historique_prix_crypto').upsert({
              crypto_id: crypto.id,
              date: today,
              prix_cloture: prix
            }, { onConflict: 'crypto_id,date' });
            totalMisAJour++;
          }
        }));
      } catch (e) {
        console.error('Erreur CoinGecko:', e);
      }

      if (i + 250 < cryptos.length) await sleep(2000);
    }
  }

  return new Response(
    JSON.stringify({ success: true, mis_a_jour: totalMisAJour, date: today }),
    { headers: { "Content-Type": "application/json" } }
  );
});