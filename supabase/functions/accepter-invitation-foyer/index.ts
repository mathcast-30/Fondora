import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { token } = await req.json()
    if (!token) return json({ error: 'Token manquant' }, 400)

    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization') } } })
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return json({ error: "Connecte-toi ou crée un compte avant d'accepter l'invitation." }, 401)

    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    const { data: invit } = await supabase.from('foyer_membres').select('*, foyers(nom)').eq('token_invitation', token).maybeSingle()
    if (!invit) return json({ error: 'Invitation introuvable.' }, 404)
    if (invit.statut !== 'invite') return json({ error: 'Invitation déjà traitée ou révoquée.' }, 403)
    if (invit.date_expiration && new Date(invit.date_expiration) < new Date()) return json({ error: 'Invitation expirée.' }, 403)
    if (invit.email_invite !== user.email.toLowerCase()) {
      return json({ error: `Cette invitation est réservée à ${invit.email_invite}. Connecte-toi avec ce compte.` }, 403)
    }

    await supabase.from('foyer_membres').update({ user_id: user.id, statut: 'actif' }).eq('id', invit.id)
    return json({ success: true, foyer_nom: invit.foyers?.nom || 'Foyer' })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})