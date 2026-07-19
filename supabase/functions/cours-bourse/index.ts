import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const TTL_MINUTES = 90

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
            .select('ticker, dernier_prix, devise, updated_at')
            .eq('ticker', ticker)
            .maybeSingle()

        if (cacheData) {
            const ageMinutes = (Date.now() - new Date(cacheData.updated_at).getTime()) / 60000
            if (ageMinutes < TTL_MINUTES) {
                return new Response(JSON.stringify({
                    symbole: ticker,
                    coursActuel: cacheData.dernier_prix,
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

        // 3. Cache absent ou expiré → appel Finnhub
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`)
        const quoteData = await quoteRes.json()

        if (!quoteData || quoteData.c === undefined || quoteData.c === 0) {
            if (cacheData) {
                return new Response(JSON.stringify({
                    symbole: ticker,
                    coursActuel: cacheData.dernier_prix,
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
            ticker,
            dernier_prix: quoteData.c,
            devise: deviseResolue,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'ticker' })

        return new Response(JSON.stringify({
            symbole: ticker,
            coursActuel: quoteData.c,
            devise: deviseResolue,
            source: 'finnhub',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})