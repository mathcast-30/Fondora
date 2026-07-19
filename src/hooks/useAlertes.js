import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAlertes() {
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchAlertes = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('alertes_utilisateur')
            .select('*')
            .order('type')
        if (!error) setAlertes(data || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchAlertes() }, [fetchAlertes])

    const toggleAlerte = async (id, actif) => {
        const { error } = await supabase
            .from('alertes_utilisateur')
            .update({ actif })
            .eq('id', id)
        if (!error) fetchAlertes()
        return { error }
    }

    const updateAlerte = async (id, updates) => {
        const { error } = await supabase
            .from('alertes_utilisateur')
            .update(updates)
            .eq('id', id)
        if (!error) fetchAlertes()
        return { error }
    }

    // Pour les nouveaux users dont le trigger n'a pas tourné
    const initAlertes = async (userId) => {
        const defaults = [
            { user_id: userId, type: 'budget_80', seuil: 80, canal: 'in_app', actif: true },
            { user_id: userId, type: 'budget_100', seuil: 100, canal: 'in_app', actif: true },
            { user_id: userId, type: 'av_8ans', seuil: null, canal: 'in_app', actif: true },
            { user_id: userId, type: 'credit_fin', seuil: null, canal: 'in_app', actif: true },
            { user_id: userId, type: 'perf_hebdo', seuil: null, canal: 'in_app', actif: false },
            { user_id: userId, type: 'actif_tangible', seuil: null, canal: 'in_app', actif: false },
        ]
        await supabase.from('alertes_utilisateur').upsert(defaults, { onConflict: 'user_id,type' })
        fetchAlertes()
    }

    return { alertes, loading, toggleAlerte, updateAlerte, initAlertes, refetch: fetchAlertes }
}