import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculerRentabilite } from '../lib/calculImmo'

export function useBiensImmobiliers() {
    const { user } = useAuth()
    const [biens, setBiens] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('biens_immobiliers')
            .select('*')
            .order('created_at', { ascending: true })
        if (!error) setBiens(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterBien = async (bien) => {
        const { data, error } = await supabase
            .from('biens_immobiliers')
            .insert({ ...bien, user_id: user.id })
            .select()
            .single()
        if (!error) await charger()
        return { data, error }
    }

    const modifierBien = async (id, updates) => {
        const { error } = await supabase
            .from('biens_immobiliers')
            .update(updates)
            .eq('id', id)
        if (!error) await charger()
        return { error }
    }

    const supprimerBien = async (id) => {
        const { error } = await supabase.from('biens_immobiliers').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    // Valeur totale du patrimoine immobilier
    const valeurTotaleImmo = biens.reduce((acc, b) => {
        const { valeurNette } = calculerRentabilite(b)
        return acc + valeurNette
    }, 0)
    return { biens, loading, ajouterBien, modifierBien, supprimerBien, valeurTotaleImmo }
}