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

    // Vérifier l'utilisateur connecté
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id

    // Purge cascade de toutes les données (RGPD Art. 17)
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

    // Supprimer le compte auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Erreur suppression auth:', deleteAuthError.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})