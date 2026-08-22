import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEntiteFiltre } from '../context/EntiteContext'

export function useComptes() {
    const { user } = useAuth()
    const { entiteFiltre } = useEntiteFiltre()
    const [comptes, setComptes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const chargerComptes = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('comptes').select('*').order('ordre', { ascending: true }).order('created_at', { ascending: true })
        if (entiteFiltre) query = query.eq('entite_id', entiteFiltre)
        const { data: comptesData, error: comptesError } = await query

        if (comptesError) {
            setError(comptesError.message)
            setLoading(false)
            return
        }

        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('compte_id, type, montant')

        if (txError) {
            setError(txError.message)
            setLoading(false)
            return
        }

        const { data: positionsData } = await supabase
            .from('positions_financieres')
            .select('compte_id, symbole, quantite, prix_achat_moyen')
        const { data: prixData } = await supabase
            .from('asset_prices_cache')
            .select('symbole, prix_actuel')
        const prixParSymbole = new Map((prixData || []).map(p => [p.symbole, Number(p.prix_actuel)]))

        const comptesEnrichis = (comptesData || []).map(compte => {
            const txCompte = txData.filter(t => t.compte_id === compte.id)
            const totalRevenus = txCompte.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
            const totalDepenses = txCompte.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
            const estInvestissement = ['pea', 'cto'].includes((compte.type || '').toLowerCase())
            const valeurPositions = estInvestissement
                ? (positionsData || []).filter(p => p.compte_id === compte.id).reduce((s, p) =>
                    s + Number(p.quantite) * (prixParSymbole.get(p.symbole) || Number(p.prix_achat_moyen)), 0)
                : 0

            return {
                ...compte,
                soldeReel: Number(compte.solde) + totalRevenus - totalDepenses + valeurPositions,
                liquidites: Number(compte.solde) + totalRevenus - totalDepenses,
                valeurPositions,
                totalRevenus,
                totalDepenses
            }
        })

        setComptes(comptesEnrichis)
        setError(null)
        setLoading(false)
    }, [entiteFiltre])

    useEffect(() => {
        if (user) chargerComptes()
    }, [user, chargerComptes])

    const ajouterCompte = async (compte) => {
        const { data, error } = await supabase
            .from('comptes')
            .insert({ ...compte, user_id: user.id })
            .select()
            .single()

        if (!error) await chargerComptes()
        return { error, data }
    }

    const modifierCompte = async (id, updates) => {
        const { error } = await supabase
            .from('comptes')
            .update(updates)
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Clôture douce : le compte disparaît des listes actives mais garde tout son
    // historique (transactions, intérêts perçus...). Réversible via reactiverCompte.
    const cloturerCompte = async (id) => {
        const { error } = await supabase
            .from('comptes')
            .update({ statut: 'cloture', date_cloture: new Date().toISOString().slice(0, 10) })
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    const reactiverCompte = async (id) => {
        const { error } = await supabase
            .from('comptes')
            .update({ statut: 'actif', date_cloture: null })
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Suppression irréversible - perd tout l'historique lié (cascade DB). À réserver
    // aux comptes vides sans historique, ou après confirmation explicite renforcée.
    const supprimerDefinitivement = async (id) => {
        const { error } = await supabase
            .from('comptes')
            .delete()
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    // Réordonne une liste de comptes (typiquement ceux d'une même catégorie) selon
    // l'ordre des ids fourni. Ne touche pas aux comptes des autres catégories.
    const reordonnerComptes = async (idsOrdonnes) => {
        await Promise.all(
            idsOrdonnes.map((id, index) =>
                supabase.from('comptes').update({ ordre: index }).eq('id', id)
            )
        )
        await chargerComptes()
    }

    return {
        comptes, loading, error,
        ajouterCompte, modifierCompte, supprimerDefinitivement, reordonnerComptes,
        cloturerCompte, reactiverCompte, chargerComptes
    }
}