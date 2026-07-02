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
        const { data, error } = await supabase
            .from('comptes')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) {
            setError(error.message)
        } else {
            setComptes(data)
            setError(null)
        }
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