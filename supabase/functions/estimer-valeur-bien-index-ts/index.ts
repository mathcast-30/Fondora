import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const TYPE_MAP = { Appartement: 'Appartement', Studio: 'Appartement', Maison: 'Maison', Immeuble: 'Maison' }

function mediane(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { bien_id } = await req.json()
    if (!bien_id) return json({ error: 'bien_id manquant' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization') } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'Non authentifié' }, 401)

    const { data: bien, error: errBien } = await supabase.from('biens_immobiliers').select('*').eq('id', bien_id).single()
    if (errBien || !bien) return json({ error: 'Bien introuvable' }, 404)
    if (!bien.surface_m2 || !bien.code_postal) {
      return json({ error: 'Renseigne la surface (m²) et le code postal du bien avant d\'estimer.' }, 400)
    }

    const typeLocal = TYPE_MAP[bien.type_bien] || null
    const url = `https://api.cquest.org/dvf?code_postal=${encodeURIComponent(bien.code_postal)}${typeLocal ? `&type_local=${encodeURIComponent(typeLocal)}` : ''}`
    const res = await fetch(url)
    if (!res.ok) return json({ error: 'Service DVF indisponible pour le moment.' }, 502)
    const data = await res.json()
    const resultats = data?.resultats || []

    const prixM2 = resultats
      .filter(r => r.valeur_fonciere > 0 && r.surface_reelle_bati > 10)
      .map(r => r.valeur_fonciere / r.surface_reelle_bati)
      .filter(p => p >= 500 && p <= 20000) // filtre anti-aberrations

    if (prixM2.length < 5) {
      return json({ error: 'Pas assez de données DVF pour cette zone (code postal trop peu de transactions récentes).' }, 422)
    }

    const prixM2Median = Math.round(mediane(prixM2))
    const valeurEstimee = Math.round(prixM2Median * Number(bien.surface_m2))

    await supabase.from('biens_immobiliers').update({
      valeur_actuelle: valeurEstimee,
      derniere_estimation_dvf: valeurEstimee,
      date_estimation_dvf: new Date().toISOString().split('T')[0],
      prix_m2_zone_dvf: prixM2Median,
      valeur_source: 'dvf',
    }).eq('id', bien_id)

    await supabase.from('estimations_immo_historique').insert({
      bien_id, user_id: user.id, valeur_estimee: valeurEstimee,
      prix_m2_zone: prixM2Median, nb_transactions_zone: prixM2.length,
    })

    return json({ success: true, valeur_estimee: valeurEstimee, prix_m2_zone: prixM2Median, nb_transactions: prixM2.length })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})