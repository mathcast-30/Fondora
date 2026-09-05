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

        // Les virements neutres entre comptes de l'utilisateur (sans catégorie) ne sont
        // pas de vrais revenus/dépenses — on les exclut ici, à la source, pour que toutes
        // les pages qui consomment ce hook (Analyse, EvolutionTempsChart) restent cohérentes
        // avec les totaux de la page Budget. Un virement catégorisé (Épargne/Investissement)
        // reste inclus, car c'est une vraie sortie du budget disponible.
        if (!error) {
            setTransactions((data || []).filter(t => !(t.source === 'virement' && !t.categorie_id)))
        }
        setLoading(false)
    }, [nombreMois])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    return { transactions, loading }
}