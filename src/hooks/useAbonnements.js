import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useAbonnements() {
    const { user } = useAuth()
    const [abonnements, setAbonnements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        const { data, error: err } = await supabase
            .from('abonnements_suivi')
            .select('*')
            .order('date_prochain_prelevement', { ascending: true })

        if (err) setError(err.message)
        else setAbonnements(data || [])
        setLoading(false)
    }, [user])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterAbonnement = async (data) => {
        const { error: err } = await supabase
            .from('abonnements_suivi')
            .insert({ ...data, user_id: user.id })
        if (!err) await charger()
        return { error: err }
    }

    const modifierAbonnement = async (id, updates) => {
        const { error: err } = await supabase
            .from('abonnements_suivi')
            .update(updates)
            .eq('id', id)
        if (!err) await charger()
        return { error: err }
    }

    const supprimerAbonnement = async (id) => {
        const { error: err } = await supabase
            .from('abonnements_suivi')
            .delete()
            .eq('id', id)
        if (!err) await charger()
        return { error: err }
    }

    const planifierResiliation = async (id, valeur) => {
        return modifierAbonnement(id, { resiliation_planifiee: valeur })
    }

    return {
        abonnements, loading, error, charger,
        ajouterAbonnement, modifierAbonnement, supprimerAbonnement, planifierResiliation,
    }
}