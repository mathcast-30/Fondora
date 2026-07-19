import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions(mois, annee) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    const debutMois = `${annee}-${String(mois).padStart(2, '0')}-01`
    const finMois = new Date(annee, mois, 0).toISOString().split('T')[0] // dernier jour du mois

    const genererRecurrentes = useCallback(async () => {
        const { data: recurrentes } = await supabase
            .from('transactions')
            .select('*')
            .eq('recurrente', true)

        if (!recurrentes) return

        const groupesTraites = new Set()

        for (const modele of recurrentes) {
            const groupeId = modele.recurrence_groupe_id
            if (groupesTraites.has(groupeId)) continue
            groupesTraites.add(groupeId)

            const { data: existeDeja } = await supabase
                .from('transactions')
                .select('id')
                .eq('recurrence_groupe_id', groupeId)
                .gte('date', debutMois)
                .lte('date', finMois)
                .limit(1)

            if (!existeDeja || existeDeja.length === 0) {
                const jour = Math.min(modele.jour_recurrence || 1, new Date(annee, mois, 0).getDate())
                const dateOccurrence = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`

                await supabase.from('transactions').insert({
                    user_id: user.id,
                    compte_id: modele.compte_id,
                    categorie_id: modele.categorie_id,
                    description: modele.description,
                    montant: modele.montant,
                    type: modele.type,
                    date: dateOccurrence,
                    recurrente: true,
                    jour_recurrence: modele.jour_recurrence,
                    recurrence_groupe_id: groupeId,
                })
            }
        }
    }, [annee, mois, debutMois, finMois, user])

    const charger = useCallback(async () => {
        setLoading(true)
        await genererRecurrentes()

        const { data, error } = await supabase
            .from('transactions')
            .select('*, comptes(nom, couleur), categories(nom, couleur)')
            .gte('date', debutMois)
            .lte('date', finMois)
            .order('date', { ascending: false })

        if (!error) setTransactions(data)
        setLoading(false)
    }, [debutMois, finMois, genererRecurrentes])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterTransaction = async (transaction) => {
        const groupeId = transaction.recurrente ? crypto.randomUUID() : null
        const { error } = await supabase.from('transactions').insert({
            ...transaction,
            user_id: user.id,
            recurrence_groupe_id: groupeId,
        })
        if (!error) await charger()
        return { error }
    }

    const supprimerTransaction = async (id) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Recatégorise en masse une liste de transactions vers une nouvelle catégorie.
     * Utilisé par le Sankey interactif (mode réaffectation).
     */
    const recategoriserTransactions = async (transactionIds, nouvelleCategorieId) => {
        if (!transactionIds || transactionIds.length === 0) return { error: null }
        const { error } = await supabase
            .from('transactions')
            .update({ categorie_id: nouvelleCategorieId })
            .in('id', transactionIds)
        if (!error) await charger()
        return { error }
    }

    return { transactions, loading, ajouterTransaction, supprimerTransaction, recategoriserTransactions, charger }
}