// src/hooks/useAnalyseFrais.js
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
    calculerValeurActuelleContrat,
    calculerTerMoyenPondere,
    calculerFraisAV,
} from '../lib/financialCalculations'

export function useAnalyseFrais() {
    const [donnees, setDonnees] = useState({
        comptes: [],
        positions: [],
        assurancesVie: [],
    })
    const [prixBourse, setPrixBourse] = useState(new Map())
    const [prixUC, setPrixUC] = useState({})
    const [avDetail, setAvDetail] = useState([]) // [{ contrat, positionsUC, valeurFondsEuros }]
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) {
                setLoading(false)
                return
            }

            // ── Requêtes parallèles ──────────────────────────────────────────
            const [comptesRes, positionsRes, avRes, prixBourseRes] = await Promise.all([
                supabase.from('comptes').select('id, nom, type, frais_courtage_pourcentage, frais_gestion_enveloppe'),
                supabase.from('positions_financieres').select('compte_id, symbole, quantite, prix_achat_moyen').eq('user_id', userData.user.id),
                supabase.from('assurances_vie').select('id, nom, assureur, frais_gestion_enveloppe, total_versements_cumules').eq('user_id', userData.user.id),
                supabase.from('asset_prices_cache').select('symbole, prix_actuel'),
            ])

            // Map symbole → prix_actuel (bourse)
            const prixBourseMap = new Map(
                (prixBourseRes.data || []).map(p => [p.symbole, Number(p.prix_actuel)])
            )

            // ── Chargement AV détaillé ───────────────────────────────────────
            const avContrats = avRes.data || []
            let avDetailData = []
            let prixUCData = {}

            if (avContrats.length > 0) {
                const contratIds = avContrats.map(av => av.id)

                const [valosRes, posUCRes] = await Promise.all([
                    supabase.from('av_valorisation_actuelle').select('*').in('contrat_id', contratIds),
                    supabase.from('assurances_vie_positions')
                        .select('contrat_id, isin, nb_parts, catalogue_actifs(frais_ter_produit)')
                        .in('contrat_id', contratIds),
                ])

                const isinsUC = [...new Set((posUCRes.data || []).map(p => p.isin).filter(Boolean))]
                if (isinsUC.length > 0) {
                    const { data: prixUCRaw } = await supabase
                        .from('asset_prices_cache')
                        .select('isin, dernier_prix')
                        .in('isin', isinsUC)
                    prixUCData = (prixUCRaw || []).reduce((acc, r) => {
                        acc[r.isin] = { dernier_prix: r.dernier_prix }
                        return acc
                    }, {})
                }

                avDetailData = avContrats.map(av => {
                    const valo = (valosRes.data || []).find(v => v.contrat_id === av.id)
                    const positionsUC = (posUCRes.data || [])
                        .filter(p => p.contrat_id === av.id)
                        .map(p => ({
                            isin: p.isin,
                            nb_parts: p.nb_parts,
                            frais_ter_produit: p.catalogue_actifs?.frais_ter_produit ?? 0,
                        }))
                    return {
                        contrat: av,
                        positionsUC,
                        valeurFondsEuros: Number(valo?.valeur_fonds_euros) || 0,
                    }
                })
            }

            setDonnees({
                comptes: comptesRes.data || [],
                positions: positionsRes.data || [],
                assurancesVie: avContrats,
            })
            setPrixBourse(prixBourseMap)
            setPrixUC(prixUCData)
            setAvDetail(avDetailData)
            setLoading(false)
        }

        fetchData()
    }, [])

    // ── KPIs ─────────────────────────────────────────────────────────────────

    const kpis = useMemo(() => {
        let totalFraisEnveloppeAnnuels = 0
        let totalFraisProduitsAnnuels = 0
        let capitalInvestiFrais = 0
        let auMoinsUneApproximation = false

        // Construire une map compte_id → frais enveloppe
        const fraisEnveloppeParCompte = new Map(
            donnees.comptes.map(c => [c.id, Number(c.frais_gestion_enveloppe) || 0])
        )

        // ── Positions boursières ──────────────────────────────────────────────
        const positionsEnrichies = donnees.positions.map(p => {
            const prixMarche = prixBourse.get(p.symbole)
            const valorisationApproximative = prixMarche == null || prixMarche <= 0
            const prixEffectif = valorisationApproximative
                ? Number(p.prix_achat_moyen)
                : prixMarche
            const valeurPosition = Number(p.quantite) * prixEffectif

            if (valorisationApproximative) auMoinsUneApproximation = true

            const fraisEnveloppe = fraisEnveloppeParCompte.get(p.compte_id) || 0
            // frais_ter_produit n'est pas dans positions_financieres → toujours 0
            const fraisProduit = 0

            totalFraisEnveloppeAnnuels += valeurPosition * (fraisEnveloppe / 100)
            totalFraisProduitsAnnuels += valeurPosition * (fraisProduit / 100)
            capitalInvestiFrais += valeurPosition

            return { ...p, valeurPosition, valorisationApproximative }
        })

        // ── Assurances vie ────────────────────────────────────────────────────
        for (const { contrat, positionsUC, valeurFondsEuros } of avDetail) {
            const { total: valeurAV } = calculerValeurActuelleContrat(
                valeurFondsEuros, positionsUC, prixUC
            )
            const terMoyen = calculerTerMoyenPondere(positionsUC, prixUC)
            const { fraisAnnuelsEuros } = calculerFraisAV(
                contrat.frais_gestion_enveloppe, terMoyen, valeurAV
            )

            // Décomposer : frais enveloppe vs TER
            const fraisEnvelAV = valeurAV * (Number(contrat.frais_gestion_enveloppe) || 0) / 100
            const fraisTerAV = fraisAnnuelsEuros - fraisEnvelAV

            totalFraisEnveloppeAnnuels += fraisEnvelAV
            totalFraisProduitsAnnuels += Math.max(0, fraisTerAV)
            capitalInvestiFrais += valeurAV
        }

        const totalFraisAnnuels = totalFraisEnveloppeAnnuels + totalFraisProduitsAnnuels
        const tauxFraisMoyen = capitalInvestiFrais > 0 ? (totalFraisAnnuels / capitalInvestiFrais) : 0

        return {
            totalFraisEnveloppeAnnuels,
            totalFraisProduitsAnnuels,
            totalFraisAnnuels,
            tauxFraisMoyen,
            capitalInvesti: capitalInvestiFrais,
            // Flag pour badge UI "⚠️ Cours indisponible, PRU utilisé"
            valorisationsApproximatives: auMoinsUneApproximation,
            // Crypto explicitement exclu
            cryptoExclue: true,
            positionsEnrichies,
        }
    }, [donnees, prixBourse, prixUC, avDetail])

    // ── Simulateur manque à gagner (intérêts composés) ───────────────────────

    const simulateur = useMemo(() => {
        const capitalInitial = kpis.capitalInvesti
        const rendementBrut = 0.07 // 7 % historique bourse
        const tauxFraisGlobal = kpis.tauxFraisMoyen
        const rendementNet = rendementBrut - tauxFraisGlobal
        const horizon = 30
        const trajectoire = []

        let capitalBrut = capitalInitial || 10000
        let capitalNet = capitalInitial || 10000

        for (let annee = 1; annee <= horizon; annee++) {
            capitalBrut = capitalBrut * (1 + rendementBrut)
            capitalNet = capitalNet * (1 + rendementNet)

            trajectoire.push({
                annee,
                capitalBrut: Math.round(capitalBrut),
                capitalNet: Math.round(capitalNet),
                siphonne: Math.round(capitalBrut - capitalNet),
            })
        }

        return trajectoire
    }, [kpis])

    return {
        donnees,
        kpis,
        simulateur,
        loading,
    }
}
