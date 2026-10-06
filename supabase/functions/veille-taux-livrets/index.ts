import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const WEBSTAT_API_KEY = Deno.env.get('WEBSTAT_API_KEY') // à créer sur https://webstat.banque-france.fr (espace personnel > API)
const CRON_SECRET = Deno.env.get('CRON_SECRET')

// Séries officielles Banque de France (dataset "observations", flow MIR1), confirmées via la console API le 20/08/2026.
const SERIES: Record<string, string> = {
  LIVRET_A: 'MIR1.M.FR.B.L23FRLA.D.R.A.2230U6.EUR.O',
  LDDS: 'MIR1.M.FR.B.L23FRLD.D.R.A.2254U6.EUR.O',
  LEP: 'MIR1.M.FR.B.L23FRLP.H.R.A.2250U6.EUR.O',
}

// Garde-fous : un taux d'épargne réglementée ne peut raisonnablement pas sortir de cette plage,
// et un écart trop brutal par rapport au dernier taux connu sent l'erreur de parsing plutôt
// qu'un vrai changement (les changements réels sont de l'ordre de 0,1 à 0,5 point).
const TAUX_MIN = 0
const TAUX_MAX = 8
const ECART_MAX_SUSPECT = 2

async function fetchDernierTaux(seriesKey: string) {
  const where = encodeURIComponent(`series_key="${seriesKey}"`)
  const url = `https://webstat.banque-france.fr/api/explore/v2.1/catalog/datasets/observations/records?where=${where}&order_by=-time_period_start&limit=1&apikey=${WEBSTAT_API_KEY}`
  const res = await fetch(url, { headers: { accept: 'application/json; charset=utf-8' } })
  if (!res.ok) {
    throw new Error(`Webstat API a répondu ${res.status} : ${await res.text().catch(() => '')}`)
  }
  const data = await res.json()
  const record = data?.results?.[0]
  if (!record) throw new Error('Aucun enregistrement retourné pour cette série')

  const taux = Number(record.obs_value)
  const date = String(record.time_period_start ?? '').slice(0, 10)

  if (isNaN(taux) || !date) {
    throw new Error(`Réponse inattendue, champs non reconnus : ${JSON.stringify(record).slice(0, 300)}`)
  }
  return { taux, date }
}

serve(async (req) => {
  if (!CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET non configuré côté serveur' }), { status: 500 })
  }
  const provided = req.headers.get('x-cron-secret')
  if (provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })
  }
  if (!WEBSTAT_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'WEBSTAT_API_KEY non configurée - saisie manuelle des taux requise en attendant' }), { status: 200 })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Configuration Supabase manquante' }), { status: 500 })
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const resultats: any[] = []

  for (const [typeLivret, seriesKey] of Object.entries(SERIES)) {
    try {
      const { taux, date } = await fetchDernierTaux(seriesKey)

      if (taux < TAUX_MIN || taux > TAUX_MAX) {
        resultats.push({ typeLivret, statut: 'rejete_hors_bornes', taux })
        continue
      }

      const { data: dernierConnu } = await supabase
        .from('taux_reglementes_historique')
        .select('taux, date_effet')
        .eq('type_livret', typeLivret)
        .order('date_effet', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (dernierConnu && Math.abs(Number(dernierConnu.taux) - taux) > ECART_MAX_SUSPECT) {
        resultats.push({ typeLivret, statut: 'rejete_ecart_suspect', taux, dernierConnu: dernierConnu.taux })
        continue
      }

      if (dernierConnu && Number(dernierConnu.taux) === taux && dernierConnu.date_effet === date) {
        resultats.push({ typeLivret, statut: 'inchange' })
        continue
      }

      const { error: insertError } = await supabase
        .from('taux_reglementes_historique')
        .upsert({ type_livret: typeLivret, taux, date_effet: date, source: 'BDF_API' }, { onConflict: 'type_livret,date_effet' })

      if (insertError) throw insertError
      resultats.push({ typeLivret, statut: 'maj', taux, date })
    } catch (err) {
      resultats.push({ typeLivret, statut: 'erreur', message: (err as Error).message })
    }
  }

  return new Response(JSON.stringify({ success: true, resultats }), { headers: { 'Content-Type': 'application/json' } })
})
