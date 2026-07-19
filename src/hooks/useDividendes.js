import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculerFiscaliteDividende, calculerSyntheseDividendes } from '../utils/fiscaliteDividendes'

export function useDividendes() {
    const { user } = useAuth()
    const [dividendes, setDividendes] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('dividendes')
            .select('*, positions_financieres(symbole, type_compte)')
            .order('date', { ascending: false })
        if (!error) setDividendes(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterDividende = async (dividende) => {
        // Si le type de compte n'est pas fourni explicitement mais qu'une position
        // est liée, on hérite de son type_compte (PEA/CTO).
        let typeCompte = dividende.type_compte
        if (!typeCompte && dividende.position_id) {
            const { data: pos } = await supabase
                .from('positions_financieres')
                .select('type_compte')
                .eq('id', dividende.position_id)
                .single()
            typeCompte = pos?.type_compte || 'CTO'
        }

        let compteId = dividende.compte_id || null
        let position = null
        if (dividende.position_id) {
            const { data } = await supabase.from('positions_financieres').select('*').eq('id', dividende.position_id).single()
            position = data
            compteId = compteId || data?.compte_id || null
        }

        const { data: created, error } = await supabase
            .from('dividendes')
            .insert({
                ...dividende,
                type_compte: typeCompte || 'CTO',
                reinvesti: dividende.reinvesti || false,
                compte_id: compteId,
                user_id: user.id,
            })
            .select()
            .single()
        if (!error && dividende.reinvesti && position) {
            const { data: asset } = await supabase.from('catalogue_actifs').select('id, ticker').eq('ticker', position.symbole).maybeSingle()
            const { data: prix } = asset
                ? await supabase.from('historique_prix_actifs').select('prix_cloture').eq('actif_id', asset.id).lte('date', dividende.date).order('date', { ascending: false }).limit(1).maybeSingle()
                : { data: null }
            const prixUnitaire = Number(prix?.prix_cloture || 0)
            if (prixUnitaire > 0) {
                const { data: ordre, error: ordreError } = await supabase.from('transactions_investissement').insert({
                    user_id: user.id, position_id: position.id, compte_id: compteId, actif_id: asset?.id || null,
                    type: 'buy', symbole: position.symbole, quantite: Number(dividende.montant) / prixUnitaire,
                    prix_unitaire: prixUnitaire, date: dividende.date, origine: 'reinvestissement_dividende',
                }).select().single()
                if (!ordreError) await supabase.from('dividendes').update({ transaction_reinvestissement_id: ordre.id }).eq('id', created.id)
            }
        }
        if (!error) await charger()
        return { error }
    }

    const supprimerDividende = async (id) => {
        const { error } = await supabase.from('dividendes').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    // Dividendes enrichis avec leur fiscalité individuelle (brut, net, impôt)
    const dividendesEnrichis = dividendes.map((d) => {
        const typeCompte = d.type_compte || d.positions_financieres?.type_compte || 'CTO'
        const fiscal = calculerFiscaliteDividende(d.montant, typeCompte)
        return { ...d, type_compte: typeCompte, fiscal }
    })

    // Total brut des 12 derniers mois (conservé pour compat rétro avec l'existant)
    const totalDouzeMois = (() => {
        const dateLimit = new Date()
        dateLimit.setMonth(dateLimit.getMonth() - 12)
        const dateLimitStr = dateLimit.toISOString().split('T')[0]

        return dividendes
            .filter((d) => d.date >= dateLimitStr)
            .reduce((s, d) => s + Number(d.montant), 0)
    })()

    // Synthèse fiscale complète (brut/net/impôt, réinvesti vs perçu, par enveloppe) sur 12 mois
    const syntheseDouzeMois = (() => {
        const dateLimit = new Date()
        dateLimit.setMonth(dateLimit.getMonth() - 12)
        const dateLimitStr = dateLimit.toISOString().split('T')[0]
        const surPeriode = dividendesEnrichis.filter((d) => d.date >= dateLimitStr)
        return calculerSyntheseDividendes(surPeriode)
    })()

    return {
        dividendes: dividendesEnrichis,
        loading,
        ajouterDividende,
        supprimerDividende,
        totalDouzeMois,
        syntheseDouzeMois,
    }
}
