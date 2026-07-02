import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useObjectifEpargne(mois, annee) {
    const { user } = useAuth()
    const [objectif, setObjectif] = useState(null)
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('objectifs_epargne')
            .select('*')
            .eq('mois', mois)
            .eq('annee', annee)
            .maybeSingle()

        if (!error) setObjectif(data)
        setLoading(false)
    }, [mois, annee])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const definirObjectif = async (montantCible) => {
        const { error } = await supabase
            .from('objectifs_epargne')
            .upsert(
                { user_id: user.id, montant_cible: montantCible, mois, annee },
                { onConflict: 'user_id,mois,annee' }
            )
        if (!error) await charger()
        return { error }
    }

    return { objectif, loading, definirObjectif }
}