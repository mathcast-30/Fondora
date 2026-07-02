import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useDividendes() {
    const { user } = useAuth()
    const [dividendes, setDividendes] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('dividendes')
            .select('*, positions_financieres(symbole)')
            .order('date', { ascending: false })
        if (!error) setDividendes(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterDividende = async (dividende) => {
        const { error } = await supabase
            .from('dividendes')
            .insert({ ...dividende, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    const supprimerDividende = async (id) => {
        const { error } = await supabase.from('dividendes').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    // Total des dividendes sur les 12 derniers mois
    const totalDouzeMois = (() => {
        const dateLimit = new Date()
        dateLimit.setMonth(dateLimit.getMonth() - 12)
        const dateLimitStr = dateLimit.toISOString().split('T')[0]

        return dividendes
            .filter((d) => d.date >= dateLimitStr)
            .reduce((s, d) => s + Number(d.montant), 0)
    })()

    return { dividendes, loading, ajouterDividende, supprimerDividende, totalDouzeMois }
}