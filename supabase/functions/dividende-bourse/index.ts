import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    let ticker: string
    try {
        const body = await req.json()
        ticker = body?.ticker
    } catch {
        return new Response(JSON.stringify({ error: 'Body JSON invalide' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (!ticker) {
        return new Response(JSON.stringify({ error: 'Ticker manquant' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Finnhub /stock/metric : dividendPerShareAnnual dans metric
        const res = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${ticker.toUpperCase()}&metric=all&token=${FINNHUB_KEY}`
        )
        const data = await res.json()
        const dividendeAnnuel = data?.metric?.dividendPerShareAnnual ?? null

        const { error } = await supabase
            .from('catalogue_actifs')
            .update({
                dividende_annuel_par_action: dividendeAnnuel,
                dividende_updated_at: new Date().toISOString(),
            })
            .eq('ticker', ticker.toUpperCase())

        if (error) throw error

        return new Response(
            JSON.stringify({ success: true, ticker: ticker.toUpperCase(), dividendeAnnuel }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
