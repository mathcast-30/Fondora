import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

// ---------------------------------------------------------------------------
// Moteur de calcul des intérêts par quinzaines (copie synchronisée avec
// src/utils/interetsLivrets.js côté front-end).
// ---------------------------------------------------------------------------
function pad(n: number) { return String(n).padStart(2, '0') }
function daysInMonth(annee: number, mois: number) { return new Date(annee, mois, 0).getDate() }

function getQuinzaines(annee: number) {
  const quinzaines = []
  for (let m = 1; m <= 12; m++) {
    const dernierJour = daysInMonth(annee, m)
    quinzaines.push({ id: `${annee}-${pad(m)}-Q1`, debut: `${annee}-${pad(m)}-01`, fin: `${annee}-${pad(m)}-15` })
    quinzaines.push({ id: `${annee}-${pad(m)}-Q2`, debut: `${annee}-${pad(m)}-16`, fin: `${annee}-${pad(m)}-${pad(dernierJour)}` })
  }
  return quinzaines
}

function getDateValeur(dateStr: string, montant: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (montant >= 0) {
    if (d <= 15) return `${y}-${pad(m)}-16`
    const mSuivant = m === 12 ? 1 : m + 1
    const ySuivant = m === 12 ? y + 1 : y
    return `${ySuivant}-${pad(mSuivant)}-01`
  }
  if (d <= 15) return `${y}-${pad(m)}-01`
  return `${y}-${pad(m)}-16`
}

function getTauxApplicable(dateStr: string, tauxHistorique: { date_effet: string, taux: number }[]) {
  const applicables = tauxHistorique
    .filter((t) => t?.date_effet && t.date_effet <= dateStr && !isNaN(Number(t.taux)))
    .sort((a, b) => (a.date_effet < b.date_effet ? 1 : -1))
  return applicables.length > 0 ? Number(applicables[0].taux) : null
}

function calculerInteretsLivret({ soldeInitial = 0, dateOuverture, transactions = [], tauxHistorique = [], annee }: {
  soldeInitial?: number, dateOuverture: string, transactions?: { date: string, montant: number }[],
  tauxHistorique?: { date_effet: string, taux: number }[], annee: number
}) {
  const quinzaines = getQuinzaines(annee)
  const mouvementsValorises = transactions
    .filter((t) => t?.date >= `${annee}-01-01` && t.date <= `${annee}-12-31` && !isNaN(Number(t.montant)))
    .map((t) => ({ montant: Number(t.montant), dateValeur: getDateValeur(t.date, Number(t.montant)) }))

  const soldeInitialSur = Number(soldeInitial) || 0
  const soldeDepart = dateOuverture > `${annee}-01-01` ? 0 : soldeInitialSur

  let montantInterets = 0
  let sommeInteretsPonderee = 0
  let sommeSoldesPonderes = 0
  const detailQuinzaines: any[] = []

  for (const q of quinzaines) {
    if (!dateOuverture || q.fin < dateOuverture) {
      detailQuinzaines.push({ ...q, soldeProductif: 0, taux: null, interet: 0 })
      continue
    }
    const soldeProductif = mouvementsValorises
      .filter((m) => m.dateValeur <= q.debut)
      .reduce((sum, m) => sum + m.montant, soldeDepart)

    const taux = getTauxApplicable(q.debut, tauxHistorique)
    const base = Math.max(Number.isFinite(soldeProductif) ? soldeProductif : 0, 0)
    const interetQuinzaine = taux != null ? (base * (taux / 100)) / 24 : 0

    montantInterets += interetQuinzaine
    if (taux != null) {
      sommeInteretsPonderee += base * taux
      sommeSoldesPonderes += base
    }
    detailQuinzaines.push({ ...q, soldeProductif: Math.round(soldeProductif * 100) / 100, taux, interet: Math.round(interetQuinzaine * 100) / 100 })
  }

  return {
    montantInterets: Number.isFinite(montantInterets) ? Math.round(montantInterets * 100) / 100 : 0,
    tauxMoyenPondere: sommeSoldesPonderes > 0 && Number.isFinite(sommeInteretsPonderee) ? Math.round((sommeInteretsPonderee / sommeSoldesPonderes) * 1000) / 1000 : null,
    detailQuinzaines,
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
const TYPE_MAP: Record<string, string> = {
  'livret a': 'LIVRET_A',
  'ldds': 'LDDS',
  'lep': 'LEP',
  'livret jeune': 'LIVRET_JEUNE',
}
const LABEL_MAP: Record<string, string> = {
  'LIVRET_A': 'Livret A',
  'LDDS': 'LDDS',
  'LEP': 'LEP',
  'LIVRET_JEUNE': 'Livret Jeune',
}

serve(async (req) => {
  if (!CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET non configuré côté serveur' }), { status: 500 })
  }
  const provided = req.headers.get('x-cron-secret')
  if (provided !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Configuration Supabase manquante' }), { status: 500 })
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let annee = new Date().getUTCFullYear()
  try {
    const body = await req.json()
    if (body?.annee) annee = Number(body.annee)
  } catch (_e) {
    // pas de body JSON fourni
  }

  const resultats: any[] = []

  try {
    const { data: comptes, error: comptesError } = await supabase
      .from('comptes')
      .select('id, user_id, type, solde, created_at, statut')
    if (comptesError) throw comptesError

    const livrets = (comptes || []).filter((c: any) => TYPE_MAP[(c.type || '').trim().toLowerCase()] && (c.statut ?? 'actif') === 'actif')
    if (livrets.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Aucun livret actif trouvé', resultats: [] }), { headers: { 'Content-Type': 'application/json' } })
    }
    const compteIds = livrets.map((c: any) => c.id)

    const { data: dejaTraites } = await supabase
      .from('interets_livrets_historique')
      .select('compte_id')
      .eq('annee', annee)
      .in('compte_id', compteIds)
    const idsDejaTraites = new Set((dejaTraites || []).map((d: any) => d.compte_id))

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('compte_id, date, montant, type')
      .in('compte_id', compteIds)
    if (txError) throw txError

    const { data: tauxNationaux, error: tauxError } = await supabase
      .from('taux_reglementes_historique')
      .select('type_livret, taux, date_effet')
    if (tauxError) throw tauxError

    const { data: tauxLivretJeune, error: tauxLJError } = await supabase
      .from('taux_livret_jeune_historique')
      .select('compte_id, taux, date_effet')
      .in('compte_id', compteIds)
    if (tauxLJError) throw tauxLJError

    const categorieCache = new Map<string, string>()

    for (const compte of livrets) {
      if (idsDejaTraites.has(compte.id)) {
        resultats.push({ compte_id: compte.id, statut: 'deja_traite' })
        continue
      }

      try {
        const typeLivret = TYPE_MAP[(compte.type || '').trim().toLowerCase()]
        const dateOuverture = (compte.created_at || `${annee}-01-01`).slice(0, 10)

        const txCompte = (transactions || []).filter((t: any) => t.compte_id === compte.id)
        const signe = (t: any) => (t.type === 'depense' ? -1 : 1) * Number(t.montant)

        // compte.solde est le solde ACTUEL (trigger DB trg_solde_compte le tient à jour
        // en direct à chaque transaction) - pas le montant de dépôt initial. On retrouve
        // ce montant de création en retirant l'effet de toutes les transactions jamais
        // faites sur ce compte, puis on reconstitue la chronologie complète (ledger).
        const effetTransactionsTotal = txCompte.reduce((s: number, t: any) => s + signe(t), 0)
        const montantCreation = (Number(compte.solde) || 0) - effetTransactionsTotal

        const ledgerComplet = [
          { date: dateOuverture, montant: montantCreation },
          ...txCompte.map((t: any) => ({ date: t.date, montant: signe(t) })),
        ]

        const soldeInitial = ledgerComplet
          .filter((m) => m.date < `${annee}-01-01`)
          .reduce((s, m) => s + m.montant, 0)

        const transactionsAnnee = ledgerComplet
          .filter((m) => m.date >= `${annee}-01-01` && m.date <= `${annee}-12-31`)

        const tauxHistorique = typeLivret === 'LIVRET_JEUNE'
          ? (tauxLivretJeune || []).filter((t: any) => t.compte_id === compte.id).map((t: any) => ({ date_effet: t.date_effet, taux: Number(t.taux) }))
          : (tauxNationaux || []).filter((t: any) => t.type_livret === typeLivret).map((t: any) => ({ date_effet: t.date_effet, taux: Number(t.taux) }))

        const resultat = calculerInteretsLivret({ soldeInitial, dateOuverture, transactions: transactionsAnnee, tauxHistorique, annee })

        let transactionId: string | null = null

        if (resultat.montantInterets > 0) {
          let categorieId = categorieCache.get(compte.user_id)
          if (!categorieId) {
            const { data: categorieExistante } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', compte.user_id)
              .eq('type', 'revenu')
              .eq('nom', "Intérêts d'épargne")
              .maybeSingle()

            if (categorieExistante) {
              categorieId = categorieExistante.id
            } else {
              const { data: nouvelleCategorie, error: catError } = await supabase
                .from('categories')
                .insert({ user_id: compte.user_id, nom: "Intérêts d'épargne", type: 'revenu', couleur: '#10b981' })
                .select('id')
                .single()
              if (catError) throw catError
              categorieId = nouvelleCategorie.id
            }
            categorieCache.set(compte.user_id, categorieId!)
          }

          const { data: nouvelleTransaction, error: insertTxError } = await supabase
            .from('transactions')
            .insert({
              user_id: compte.user_id,
              compte_id: compte.id,
              categorie_id: categorieId,
              description: `Intérêts ${LABEL_MAP[typeLivret]} ${annee}`,
              montant: resultat.montantInterets,
              type: 'revenu',
              date: `${annee}-12-31`,
              source: 'interet_livret',
            })
            .select('id')
            .single()
          if (insertTxError) throw insertTxError
          transactionId = nouvelleTransaction.id
        }

        const { error: histError } = await supabase
          .from('interets_livrets_historique')
          .insert({
            compte_id: compte.id,
            user_id: compte.user_id,
            annee,
            taux_moyen_pondere: resultat.tauxMoyenPondere,
            montant_interets: resultat.montantInterets,
            detail_quinzaines: resultat.detailQuinzaines,
            transaction_id: transactionId,
          })
        if (histError) throw histError

        resultats.push({ compte_id: compte.id, type: typeLivret, statut: 'ok', montant_interets: resultat.montantInterets })
      } catch (errCompte) {
        resultats.push({ compte_id: compte.id, statut: 'erreur', message: (errCompte as Error).message })
      }
    }

    return new Response(JSON.stringify({ success: true, annee, resultats }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message, resultats }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
