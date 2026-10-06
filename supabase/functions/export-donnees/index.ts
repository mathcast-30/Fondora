import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://fondora.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Récupérer le JWT de l'utilisateur
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Client avec le JWT utilisateur (respecte le RLS)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Récupérer l'utilisateur courant
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const uid = user.id

    // Fonction utilitaire pour fetch une table avec gestion d'erreur silencieuse
    const fetchTable = async (table: string, filters?: Record<string, string>) => {
      let query = supabaseUser.from(table).select('*')
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value)
        }
      }
      const { data, error } = await query
      if (error) {
        console.error(`Erreur table ${table}:`, error.message)
        return []
      }
      return data ?? []
    }

    // Collecter toutes les données de l'utilisateur en parallèle
    const [
      profil,
      comptes,
      transactions,
      categories,
      budgets,
      smartRules,
      objectifsEpargne,
      bienImmobiliers,
      dettes,
      compteInvestissement,
      positionsFinancieres,
      positionsInvestissement,
      transactionsBourse,
      transactionsInvestissement,
      dividendes,
      positionsCrypto,
      transactionsCrypto,
      historiqueValeurCrypto,
      assurancesVie,
      assurancesVieVersements,
      assurancesVieValorisations,
      assurancesViePositions,
      alertesUtilisateur,
      notificationsLog,
      snapshotPatrimoine,
      historiquePatrimoine,
      consentements,
    ] = await Promise.all([
      fetchTable('profiles', { id: uid }),
      fetchTable('comptes', { user_id: uid }),
      fetchTable('transactions', { user_id: uid }),
      fetchTable('categories', { user_id: uid }),
      fetchTable('budgets', { user_id: uid }),
      fetchTable('smart_rules', { user_id: uid }),
      fetchTable('objectifs_epargne', { user_id: uid }),
      fetchTable('biens_immobiliers', { user_id: uid }),
      fetchTable('dettes', { user_id: uid }),
      fetchTable('comptes_investissement', { user_id: uid }),
      fetchTable('positions_financieres', { user_id: uid }),
      fetchTable('positions_investissement', { user_id: uid }),
      fetchTable('transactions_bourse', { user_id: uid }),
      fetchTable('transactions_investissement', { user_id: uid }),
      fetchTable('dividendes', { user_id: uid }),
      fetchTable('positions_crypto', { user_id: uid }),
      fetchTable('transactions_crypto', { user_id: uid }),
      fetchTable('historique_valeur_crypto', { user_id: uid }),
      fetchTable('assurances_vie', { user_id: uid }),
      fetchTable('assurances_vie_versements', { user_id: uid }),
      fetchTable('assurances_vie_valorisations', { user_id: uid }),
      fetchTable('assurances_vie_positions', { user_id: uid }),
      fetchTable('alertes_utilisateur', { user_id: uid }),
      fetchTable('notifications_log', { user_id: uid }),
      fetchTable('snapshot_patrimoine', { user_id: uid }),
      fetchTable('historique_patrimoine', { user_id: uid }),
      fetchTable('consentements', { user_id: uid }),
    ])

    // Construire le payload d'export
    const exportPayload = {
      meta: {
        export_date: new Date().toISOString(),
        user_id: uid,
        email: user.email,
        version_export: '1.0',
        application: 'Fondora',
        rgpd_base_legale: 'Article 20 RGPD — Droit à la portabilité des données',
      },
      profil: profil[0] ?? null,
      comptes,
      transactions,
      categories,
      budgets,
      smart_rules: smartRules,
      objectifs_epargne: objectifsEpargne,
      immobilier: {
        biens: bienImmobiliers,
        dettes,
      },
      investissements: {
        comptes: compteInvestissement,
        positions_financieres: positionsFinancieres,
        positions: positionsInvestissement,
        transactions_bourse: transactionsBourse,
        transactions: transactionsInvestissement,
        dividendes,
      },
      crypto: {
        positions: positionsCrypto,
        transactions: transactionsCrypto,
        historique_valeur: historiqueValeurCrypto,
      },
      assurances_vie: {
        contrats: assurancesVie,
        versements: assurancesVieVersements,
        valorisations: assurancesVieValorisations,
        positions: assurancesViePositions,
      },
      notifications: {
        alertes_configurees: alertesUtilisateur,
        journal: notificationsLog,
      },
      snapshots: {
        patrimoine: snapshotPatrimoine,
        historique: historiquePatrimoine,
      },
      consentements_rgpd: consentements,
    }

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fondora-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (err) {
    console.error('Erreur export-donnees:', err)
    return new Response(JSON.stringify({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
