import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Récupère toutes les transactions des N derniers mois (incluant le mois actuel)
export function useTransactionsPeriode(nombreMois = 6) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const aujourdHui = new Date()
        const dateDebut = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - (nombreMois - 1), 1)
        const debutStr = dateDebut.toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(nom, couleur, type)')
            .gte('date', debutStr)
            .order('date', { ascending: true })

        if (!error) setTransactions(data)
        setLoading(false)
    }, [nombreMois])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    return { transactions, loading }
}