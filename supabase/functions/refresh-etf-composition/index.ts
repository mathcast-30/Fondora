// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UA = 'Mozilla/5.0 (compatible; FondoraBot/1.0)'

const SECTEUR_LABELS: Record<string, string> = {
    realestate: 'Immobilier',
    consumer_cyclical: 'Consommation cyclique',
    basic_materials: 'Matériaux',
    consumer_defensive: 'Consommation défensive',
    technology: 'Technologie',
    communication_services: 'Communication',
    financial_services: 'Finance',
    utilities: 'Services publics',
    industrials: 'Industrie',
    energy: 'Énergie',
    healthcare: 'Santé',
}

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
    try {
        const cookieRes = await fetch('https://fc.yahoo.com', {
            headers: { 'User-Agent': UA },
            redirect: 'manual',
        })
        const cookie = (cookieRes.headers.getSetCookie?.() ?? [cookieRes.headers.get('set-cookie') ?? ''])
            .map((c: string) => c.split(';')[0])
            .filter(Boolean)
            .join('; ')
        if (!cookie) return null

        const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
            headers: { 'User-Agent': UA, 'Cookie': cookie },
        })
        if (!crumbRes.ok) return null
        const crumb = (await crumbRes.text()).trim()
        if (!crumb || crumb.includes('<html') || crumb.length > 20) return null
        return { crumb, cookie }
    } catch (_e) {
        return null
    }
}

async function getYahooEnrichmentETF(
    ticker: string,
    auth: { crumb: string; cookie: string }
): Promise<{ ter: number | null; secteurs: { libelle: string; pourcentage: number }[] }> {
    const vide = { ter: null, secteurs: [] as { libelle: string; pourcentage: number }[] }
    try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=topHoldings,fundProfile&crumb=${encodeURIComponent(auth.crumb)}`
        const res = await fetch(url, { headers: { 'User-Agent': UA, 'Cookie': auth.cookie } })
        if (!res.ok) return vide

        const data = await res.json()
        const result = data?.quoteSummary?.result?.[0]
        if (!result) return vide

        const ratio = result?.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio?.raw
        const ter = typeof ratio === 'number' ? Math.round(ratio * 10000) / 100 : null

        const weightings = result?.topHoldings?.sectorWeightings || []
        const secteurs: { libelle: string; pourcentage: number }[] = []
        for (const entry of weightings) {
            const cle = Object.keys(entry)[0]
            const raw = entry?.[cle]?.raw
            const libelle = SECTEUR_LABELS[cle]
            if (libelle && typeof raw === 'number' && raw > 0) {
                secteurs.push({ libelle, pourcentage: Math.round(raw * 10000) / 100 })
            }
        }
        return { ter, secteurs }
    } catch (_e) {
        return vide
    }
}

const attendre = (ms: number) => new Promise(r => setTimeout(r, ms))

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const resultat = { tickersTraites: 0, misAJour: 0, ignoresManuels: 0, echecs: [] as string[] }

    try {
        const { data: composition } = await supabase.from('etf_composition').select('ticker')
        const { data: positions } = await supabase
            .from('positions_financieres')
            .select('symbole')
            .not('symbole', 'is', null)

        const tickers = Array.from(new Set([
            ...(composition ?? []).map((c: any) => c.ticker),
            ...(positions ?? []).map((p: any) => p.symbole),
        ]))

        if (tickers.length === 0) {
            return new Response(JSON.stringify({ success: true, ...resultat }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // On récupère les sources actuelles pour ne jamais écraser une correction manuelle
        const { data: sources } = await supabase
            .from('catalogue_actifs')
            .select('ticker, ter_source')
            .in('ticker', tickers)
        const sourceParTicker: Record<string, string> = {}
        ;(sources ?? []).forEach((s: any) => { sourceParTicker[s.ticker] = s.ter_source })

        const auth = await getYahooCrumb()
        if (!auth) {
            return new Response(JSON.stringify({ success: false, error: 'Yahoo a bloqué le handshake crumb/cookie', ...resultat }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        for (const ticker of tickers) {
            resultat.tickersTraites++
            const { ter, secteurs } = await getYahooEnrichmentETF(ticker, auth)

            if (ter === null && secteurs.length === 0) {
                resultat.echecs.push(ticker)
                await attendre(400)
                continue
            }

            const estManuel = sourceParTicker[ticker] === 'manuel'

            if (ter !== null && !estManuel) {
                await supabase.from('catalogue_actifs').update({ frais_ter_produit: ter, ter_source: 'yahoo_auto' }).eq('ticker', ticker)
            } else if (ter !== null && estManuel) {
                resultat.ignoresManuels++
            }

            if (secteurs.length > 0) {
                await supabase.from('etf_composition').delete().eq('ticker', ticker).eq('dimension', 'sectoriel')
                await supabase.from('etf_composition').insert(
                    secteurs.map(s => ({ ticker, dimension: 'sectoriel', libelle: s.libelle, pourcentage: s.pourcentage }))
                )
            }

            resultat.misAJour++
            await attendre(400)
        }

        return new Response(JSON.stringify({ success: true, ...resultat }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message, ...resultat }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
