import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { analyserFraisGlobaux, calculerTrajectoireFrais } from '../utils/analyserFrais'

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
        return analyserFraisGlobaux({
            comptes: donnees.comptes,
            positions: donnees.positions,
            prixBourse,
            avDetail,
            prixUC,
        })
    }, [donnees, prixBourse, prixUC, avDetail])

    // ── Simulateur manque à gagner (intérêts composés) ───────────────────────

    const simulateur = useMemo(() => {
        return calculerTrajectoireFrais({
            capitalInvesti: kpis.capitalInvesti,
            tauxFraisMoyen: kpis.tauxFraisMoyen,
        })
    }, [kpis])

    return {
        donnees,
        kpis,
        simulateur,
        loading,
    }
}
