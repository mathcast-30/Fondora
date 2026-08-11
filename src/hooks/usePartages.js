import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function genererToken() {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function usePartages() {
    const { user } = useAuth()
    const [partages, setPartages] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase.from('partages_patrimoine').select('*').order('created_at', { ascending: false })
        if (!error) setPartages(data || [])
        setLoading(false)
    }, [user])

    useEffect(() => { charger() }, [charger])

    const creerPartage = async ({ nom_partage, masquer_montants, date_expiration }) => {
        const token = genererToken()
        const { error } = await supabase.from('partages_patrimoine').insert({
            user_id: user.id, token,
            nom_partage: nom_partage || 'Mon patrimoine',
            masquer_montants: !!masquer_montants,
            date_expiration: date_expiration || null,
        })
        if (!error) await charger()
        return { error, token }
    }

    const revoquerPartage = async (id) => {
        const { error } = await supabase.from('partages_patrimoine').update({ actif: false }).eq('id', id)
        if (!error) await charger()
        return { error }
    }

    const supprimerPartage = async (id) => {
        const { error } = await supabase.from('partages_patrimoine').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { partages, loading, creerPartage, revoquerPartage, supprimerPartage, charger }
}