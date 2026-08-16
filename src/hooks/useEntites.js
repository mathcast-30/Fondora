import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
    const [entites, setEntites] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase.from('entites').select('*').order('created_at', { ascending: true })
        if (!error) setEntites(data || [])
        setLoading(false)
    }, [user])

    useEffect(() => { charger() }, [charger])

    const ajouterEntite = async (payload) => {
        const { error } = await supabase.from('entites').insert({ ...payload, user_id: user.id })
        if (!error) await charger()
        return { error }
    }
    const modifierEntite = async (id, updates) => {
        const { error } = await supabase.from('entites').update(updates).eq('id', id)
        if (!error) await charger()
        return { error }
    }
    const supprimerEntite = async (id) => {
        const { error } = await supabase.from('entites').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { entites, loading, ajouterEntite, modifierEntite, supprimerEntite }
}