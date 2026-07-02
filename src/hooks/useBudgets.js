import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBudgets(mois, annee) {
    const { user } = useAuth()
    const [budgets, setBudgets] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('budgets')
            .select('*, categories(nom, couleur, type)')
            .eq('mois', mois)
            .eq('annee', annee)

        if (!error) setBudgets(data)
        setLoading(false)
    }, [mois, annee])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const definirBudget = async (categorieId, montantMax) => {
        const { error } = await supabase
            .from('budgets')
            .upsert(
                { user_id: user.id, categorie_id: categorieId, montant_max: montantMax, mois, annee },
                { onConflict: 'categorie_id,mois,annee' }
            )
        if (!error) await charger()
        return { error }
    }

    const supprimerBudget = async (id) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { budgets, loading, definirBudget, supprimerBudget, charger }
}