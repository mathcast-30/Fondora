import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PERIODES_JOURS = {
    '7j': 7,
    '30j': 30,
    '1an': 365,
    'tout': null, // null = pas de limite
}

export function useHistoriquePatrimoine(valeurActuelle) {
    const { user } = useAuth()
    const [historique, setHistorique] = useState([])
    const [periode, setPeriode] = useState('30j')
    const [loading, setLoading] = useState(true)

    // Enregistre (ou met à jour) l'instantané du jour avec la valeur actuelle
    const enregistrerInstantane = useCallback(async () => {
        if (valeurActuelle === undefined || valeurActuelle === null) return

        const aujourdHui = new Date().toISOString().split('T')[0]

        await supabase
            .from('historique_patrimoine')
            .upsert(
                { user_id: user.id, date: aujourdHui, valeur_positions: valeurActuelle },
                { onConflict: 'user_id,date' }
            )
    }, [valeurActuelle, user])

    const charger = useCallback(async () => {
        setLoading(true)

        const { data, error } = await supabase
            .from('historique_patrimoine')
            .select('*')
            .order('date', { ascending: true })

        if (!error) setHistorique(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user && valeurActuelle !== undefined && valeurActuelle !== null) {
            enregistrerInstantane().then(() => charger())
        }
    }, [user, valeurActuelle, enregistrerInstantane, charger])

    // Filtre l'historique selon la période sélectionnée
    const historiqueFiltre = (() => {
        const nbJours = PERIODES_JOURS[periode]
        if (nbJours === null) return historique

        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - nbJours)
        const dateLimitStr = dateLimit.toISOString().split('T')[0]

        return historique.filter((h) => h.date >= dateLimitStr)
    })()

    return { historique: historiqueFiltre, periode, setPeriode, loading }
}