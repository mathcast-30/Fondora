import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { token } = await req.json()
    if (!token) return json({ error: 'Token manquant' }, 400)
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: partage } = await supabase.from('partages_patrimoine').select('*').eq('token', token).maybeSingle()
    if (!partage) return json({ error: 'Lien introuvable.' }, 404)
    if (!partage.actif) return json({ error: 'Ce lien a été révoqué.' }, 403)
    if (partage.date_expiration && new Date(partage.date_expiration) < new Date()) return json({ error: 'Ce lien a expiré.' }, 403)

    const { data: historique } = await supabase
      .from('snapshot_patrimoine')
      .select('date, total_cash, total_bourse, total_crypto, total_assurance_vie, total_immo_net, total_tangible, total_dettes')
      .eq('user_id', partage.user_id)
      .order('date', { ascending: true })

    await supabase.from('partages_patrimoine')
      .update({ derniere_consultation: new Date().toISOString(), nombre_vues: (partage.nombre_vues || 0) + 1 })
      .eq('id', partage.id)

    return json({
      nom_partage: partage.nom_partage,
      masquer_montants: partage.masquer_montants,
      historique: historique || [],
      dernierSnapshot: historique?.length ? historique[historique.length - 1] : null,
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})