import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export function useAnalyseFrais() {
    const [donnees, setDonnees] = useState({
        comptes: [],
        positions: [],
        assurancesVie: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: userData } = await supabase.auth.getUser()
            if (!userData?.user) {
                setLoading(false)
                return
            }

            const [comptesRes, positionsRes, avRes] = await Promise.all([
                supabase.from('comptes').select('*'),
                supabase.from('positions_financieres').select('*, comptes(frais_courtage_pourcentage, frais_gestion_enveloppe)'),
                supabase.from('assurances_vie').select('*'),
            ])

            setDonnees({
                comptes: comptesRes.data || [],
                positions: positionsRes.data || [],
                assurancesVie: avRes.data || [],
            })
            setLoading(false)
        }
        fetchData()
    }, [])

    const kpis = useMemo(() => {
        let totalFraisEnveloppeAnnuels = 0
        let totalFraisProduitsAnnuels = 0
        let capitalInvestiFrais = 0 // capital to apply percentage fees to

        // Pour les comptes classiques (PEA, CTO, etc.)
        donnees.positions.forEach(p => {
            const valeurPosition = p.quantite * p.prix_achat_moyen // ou prix actuel si dispo, utilisons le PRU par simplicité
            const fraisEnveloppe = (p.comptes?.frais_gestion_enveloppe || 0) / 100
            const fraisProduit = (p.frais_ter_produit || 0) / 100

            totalFraisEnveloppeAnnuels += valeurPosition * fraisEnveloppe
            totalFraisProduitsAnnuels += valeurPosition * fraisProduit
            capitalInvestiFrais += valeurPosition
        })

        // Pour les assurances vie
        donnees.assurancesVie.forEach(av => {
            // Note: Normalement il faudrait joindre avec assurances_vie_valorisation, mais on simplifie avec un capital estimé
            // ou on prend une moyenne. Par simplification on suppose que capitalInvestiFrais inclut les AV si la donnée est complète.
        })

        const totalFraisAnnuels = totalFraisEnveloppeAnnuels + totalFraisProduitsAnnuels
        const tauxFraisMoyen = capitalInvestiFrais > 0 ? (totalFraisAnnuels / capitalInvestiFrais) : 0

        return {
            totalFraisEnveloppeAnnuels,
            totalFraisProduitsAnnuels,
            totalFraisAnnuels,
            tauxFraisMoyen,
            capitalInvesti: capitalInvestiFrais
        }
    }, [donnees])

    // Simulateur de manque à gagner (Intérêts Composés)
    const simulateur = useMemo(() => {
        const capitalInitial = kpis.capitalInvesti
        const rendementBrut = 0.07 // 7% historique bourse
        const tauxFraisGlobal = kpis.tauxFraisMoyen
        const rendementNet = rendementBrut - tauxFraisGlobal
        const horizon = 30
        const trajectoire = []

        let capitalBrut = capitalInitial || 10000 // default if no capital
        let capitalNet = capitalInitial || 10000

        for (let annee = 1; annee <= horizon; annee++) {
            // Intérêts composés année par année
            capitalBrut = capitalBrut * (1 + rendementBrut)
            capitalNet = capitalNet * (1 + rendementNet)

            trajectoire.push({
                annee,
                capitalBrut: Math.round(capitalBrut),
                capitalNet: Math.round(capitalNet),
                siphonne: Math.round(capitalBrut - capitalNet)
            })
        }

        return trajectoire
    }, [kpis])

    return {
        donnees,
        kpis,
        simulateur,
        loading
    }
}
