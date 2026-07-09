import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useComptes() {
    const { user } = useAuth()
    const [comptes, setComptes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const chargerComptes = useCallback(async () => {
        setLoading(true)
        const { data: comptesData, error: comptesError } = await supabase
            .from('comptes')
            .select('*')
            .order('created_at', { ascending: true })

        if (comptesError) {
            setError(comptesError.message)
            setLoading(false)
            return
        }

        // TODO: Paginer ou limiter le chargement des transactions si l'utilisateur en a beaucoup
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('compte_id, type, montant')
            
        if (txError) {
            setError(txError.message)
            setLoading(false)
            return
        }

        const comptesEnrichis = comptesData.map(compte => {
            const txCompte = txData.filter(t => t.compte_id === compte.id)
            const totalRevenus = txCompte.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
            const totalDepenses = txCompte.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
            
            return {
                ...compte,
                soldeReel: Number(compte.solde) + totalRevenus - totalDepenses,
                totalRevenus,
                totalDepenses
            }
        })

        setComptes(comptesEnrichis)
        setError(null)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) chargerComptes()
    }, [user, chargerComptes])

    const ajouterCompte = async (compte) => {
        const { error } = await supabase
            .from('comptes')
            .insert({ ...compte, user_id: user.id })

        if (!error) await chargerComptes()
        return { error }
    }

    const modifierCompte = async (id, updates) => {
        const { error } = await supabase
            .from('comptes')
            .update(updates)
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    const supprimerCompte = async (id) => {
        const { error } = await supabase
            .from('comptes')
            .delete()
            .eq('id', id)

        if (!error) await chargerComptes()
        return { error }
    }

    return { comptes, loading, error, ajouterCompte, modifierCompte, supprimerCompte, chargerComptes }
}