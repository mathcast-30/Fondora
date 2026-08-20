import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useFoyerActif } from '../context/FoyerContext'
import { toastError } from '../utils/toast'

export const TYPES_ENTITE = [
    { value: 'personnel', label: 'Personnel', emoji: '👤' },
    { value: 'conjoint', label: 'Conjoint', emoji: '💑' },
    { value: 'enfant', label: 'Enfant', emoji: '👶' },
    { value: 'sci', label: 'SCI', emoji: '🏢' },
    { value: 'sas', label: 'SAS', emoji: '🏛️' },
    { value: 'eurl', label: 'EURL', emoji: '🏛️' },
    { value: 'autre', label: 'Autre', emoji: '📋' },
]

export function useEntites() {
    const { user } = useAuth()
    const { ownerUserIdActif } = useFoyerActif()
    const [entites, setEntites] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        let query = supabase.from('entites').select('*').order('created_at', { ascending: true })
        if (ownerUserIdActif) query = query.eq('user_id', ownerUserIdActif)
        const { data, error } = await query
        if (!error) setEntites(data || [])
        setLoading(false)
    }, [user, ownerUserIdActif])

    useEffect(() => { charger() }, [charger])

    const ajouterEntite = async (payload) => {
        const { error } = await supabase.from('entites').insert({ ...payload, user_id: ownerUserIdActif })
        if (error) { toastError(error.message) } else { await charger() }
        return { error }
    }
    const modifierEntite = async (id, updates) => {
        const { error } = await supabase.from('entites').update(updates).eq('id', id)
        if (error) { toastError(error.message) } else { await charger() }
        return { error }
    }
    const supprimerEntite = async (id) => {
        const { error } = await supabase.from('entites').delete().eq('id', id)
        if (error) { toastError(error.message) } else { await charger() }
        return { error }
    }

    return { entites, loading, ajouterEntite, modifierEntite, supprimerEntite }
}