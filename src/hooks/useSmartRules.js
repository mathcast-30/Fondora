import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSmartRules() {
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchRules = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('smart_rules')
            .select('*, categories(nom, couleur)')
            .order('priorite', { ascending: true })
        if (!error) setRules(data || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchRules() }, [fetchRules])

    const addRule = async ({ mot_cle, categorie_id, priorite }) => {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('smart_rules').insert({
            user_id: user.id, mot_cle, categorie_id, priorite: priorite || 1
        })
        if (!error) fetchRules()
        return { error }
    }

    const updateRule = async (id, updates) => {
        const { error } = await supabase.from('smart_rules').update(updates).eq('id', id)
        if (!error) fetchRules()
        return { error }
    }

    const deleteRule = async (id) => {
        const { error } = await supabase.from('smart_rules').delete().eq('id', id)
        if (!error) fetchRules()
        return { error }
    }

    return { rules, loading, addRule, updateRule, deleteRule, refetch: fetchRules }
}