import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useBudgets(mois, annee) {
    const { user } = useAuth()
    const [budgets, setBudgets] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        // Un budget est une enveloppe mensuelle persistante : pour le mois affiché,
        // on prend la dernière valeur définie pour chaque catégorie jusqu'à ce mois.
        // Une modification crée une exception à partir du mois courant, qui sera
        // elle-même reprise automatiquement les mois suivants.
        const { data, error } = await supabase
            .from('budgets')
            .select('*, categories(nom, couleur, type)')
            .eq('user_id', user.id)
            .order('annee', { ascending: false })
            .order('mois', { ascending: false })

        if (!error) {
            const dejaChoisi = new Set()
            const budgetsApplicables = (data || []).filter(b =>
                b.annee < annee || (b.annee === annee && b.mois <= mois)
            ).filter(b => {
                if (dejaChoisi.has(b.categorie_id)) return false
                dejaChoisi.add(b.categorie_id)
                return true
            }).map(b => ({
                ...b,
                herite: b.annee !== annee || b.mois !== mois,
            }))
            setBudgets(budgetsApplicables)
        }
        setLoading(false)
    }, [mois, annee, user])

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
