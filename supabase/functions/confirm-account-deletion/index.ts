import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: { token?: string } = {}
    try {
      body = await req.json()
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Body JSON invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { token } = body
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Rechercher la demande de suppression valide
    const { data: demande, error: demandeError } = await supabase
      .from('demandes_suppression')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (demandeError || !demande) {
      return new Response(JSON.stringify({ error: 'Lien ou token invalide.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Vérifier l'expiration et le statut
    if (demande.status && demande.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Cette demande a déjà été traitée.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (demande.expires_at && new Date(demande.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Ce lien de confirmation a expiré.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = demande.user_id

    // 3. Purge cascade de toutes les données (RGPD Art. 17)
    const tables = [
      'alertes_utilisateur',
      'smart_rules',
      'demandes_suppression',
      'notifications_log',
      'consentements',
      'snapshot_patrimoine',
      'assurances_vie_positions',
      'assurances_vie_valorisations',
      'assurances_vie_versements',
      'assurances_vie',
      'positions_crypto',
      'transactions_investissement',
      'positions_financieres',
      'actifs_tangibles',
      'dettes',
      'biens_immobiliers',
      'budgets',
      'transactions',
      'categories',
      'comptes',
      'profiles',
    ]

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
      if (error) console.error(`Erreur table ${table}:`, error.message)
    }

    // 4. Marquer la demande comme exécutée si la table n'a pas été supprimée en cascade
    await supabase
      .from('demandes_suppression')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('token', token)

    // 5. Supprimer le compte auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Erreur suppression auth:', deleteAuthError.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message || 'Erreur interne' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
