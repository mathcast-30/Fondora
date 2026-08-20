import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Taux nationaux Livret A / LDDS / LEP, valables pour tous les utilisateurs
export function useTauxReglementes() {
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
            .from('taux_reglementes_historique')
            .select('type_livret, taux, date_effet')
            .order('date_effet', { ascending: true })
        setHistorique(data || [])
        setLoading(false)
    }, [])

    useEffect(() => { charger() }, [charger])

    // Taux en vigueur aujourd'hui pour un type donné ('LIVRET_A' | 'LDDS' | 'LEP')
    const getTauxActuel = useCallback((typeLivret) => {
        const aujourdHui = new Date().toISOString().slice(0, 10)
        const applicables = historique
            .filter((t) => t.type_livret === typeLivret && t.date_effet <= aujourdHui)
            .sort((a, b) => (a.date_effet < b.date_effet ? 1 : -1))
        return applicables.length > 0 ? Number(applicables[0].taux) : null
    }, [historique])

    // Historique complet pour un type donné (utile pour le calcul des intérêts et l'affichage)
    const getHistoriquePourType = useCallback((typeLivret) => {
        return historique.filter((t) => t.type_livret === typeLivret)
    }, [historique])

    return { historique, loading, getTauxActuel, getHistoriquePourType, recharger: charger }
}