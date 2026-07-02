import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePositionsCrypto() {
    const { user } = useAuth()
    const [positions, setPositions] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('positions_crypto')
            .select('*')
            .order('created_at', { ascending: true })
        if (!error) setPositions(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterPosition = async (position) => {
        const { error } = await supabase
            .from('positions_crypto')
            .insert({ ...position, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    const supprimerPosition = async (id) => {
        const { error } = await supabase.from('positions_crypto').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { positions, loading, ajouterPosition, supprimerPosition }
}