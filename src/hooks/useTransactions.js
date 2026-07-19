import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions(mois, annee) {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    const debutMois = `${annee}-${String(mois).padStart(2, '0')}-01`
    const finMois = new Date(annee, mois, 0).toISOString().split('T')[0]

    // Génère les occurrences mensuelles des transactions récurrentes manuelles
    const genererRecurrentes = useCallback(async () => {
        const { data: recurrentes } = await supabase
            .from('transactions')
            .select('*')
            .eq('recurrente', true)
            .neq('recurrence_active', false)

        if (!recurrentes) return

        const groupesTraites = new Set()

        for (const modele of recurrentes) {
            const groupeId = modele.recurrence_groupe_id || modele.id
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
                    recurrence_modele: false,
                    recurrence_active: true,
                    jour_recurrence: modele.jour_recurrence,
                    recurrence_groupe_id: groupeId,
                })
            }
        }
    }, [annee, mois, debutMois, finMois, user])

    // Génère automatiquement les loyers des biens immobiliers en location ce mois-ci
    const genererLoyersImmo = useCallback(async () => {
        const { data: biens } = await supabase
            .from('biens_immobiliers')
            .select('id, nom, loyer_mensuel, statut')
            .eq('user_id', user.id)
            .in('statut', ['loue', 'location', 'En location', 'Loué'])
            .gt('loyer_mensuel', 0)

        if (!biens || biens.length === 0) return

        // Récupérer la catégorie "Revenus locatifs" ou "Loyers"
        const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .or('nom.ilike.%loyer%,nom.ilike.%locatif%,nom.ilike.%immobilier%')
            .limit(1)
            .maybeSingle()

        for (const bien of biens) {
            // Vérifier si un loyer a déjà été généré ce mois pour ce bien
            const { data: existe } = await supabase
                .from('transactions')
                .select('id')
                .eq('source', 'loyer_auto')
                .eq('dette_id', bien.id) // on réutilise dette_id comme foreign key générique vers l'actif
                .gte('date', debutMois)
                .lte('date', finMois)
                .maybeSingle()

            if (existe) continue

            // Générer le loyer le 1er du mois
            const dateLoyer = `${annee}-${String(mois).padStart(2, '0')}-01`

            await supabase.from('transactions').insert({
                user_id: user.id,
                compte_id: null,
                categorie_id: cat?.id || null,
                description: `Loyer — ${bien.nom}`,
                montant: Number(bien.loyer_mensuel),
                type: 'revenu',
                date: dateLoyer,
                recurrente: true,
                recurrence_modele: false,
                recurrence_active: true,
                jour_recurrence: 1,
                source: 'loyer_auto',
                dette_id: bien.id, // référence au bien
            })
        }
    }, [annee, mois, debutMois, finMois, user])

    // Génère les mensualités de dettes ce mois (au cas où elles n'ont pas encore été créées)
    const genererMensualitesDettes = useCallback(async () => {
        const { data: dettes } = await supabase
            .from('dettes')
            .select('id, nom, mensualite, compte_id, date_debut, duree_mois, taux_interet, capital_emprunte')
            .eq('user_id', user.id)
            .eq('rembourse_automatiquement', true)
            .not('compte_id', 'is', null)

        if (!dettes || dettes.length === 0) return

        const CATEGORIE_CREDITS = 'c139d313-61e3-48ce-b163-968daf7926c6'

        for (const dette of dettes) {
            // Calculer si la dette est encore active ce mois
            const dateDebut = new Date(dette.date_debut)
            const dateMoisCourant = new Date(annee, mois - 1, 1)
            if (dateMoisCourant < dateDebut) continue

            const moisEcoules = (annee - dateDebut.getFullYear()) * 12 + (mois - 1 - dateDebut.getMonth())
            if (moisEcoules >= dette.duree_mois) continue // dette terminée

            // Vérifier si la mensualité existe déjà ce mois
            const { data: existe } = await supabase
                .from('transactions')
                .select('id')
                .eq('dette_id', dette.id)
                .eq('source', 'dette_auto')
                .gte('date', debutMois)
                .lte('date', finMois)
                .maybeSingle()

            if (existe) continue

            // Jour d'échéance = jour de date_debut
            const jourEcheance = dateDebut.getDate()
            const maxJour = new Date(annee, mois, 0).getDate()
            const jour = Math.min(jourEcheance, maxJour)
            const dateEcheance = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`

            await supabase.from('transactions').insert({
                user_id: user.id,
                compte_id: dette.compte_id,
                categorie_id: CATEGORIE_CREDITS,
                description: `Mensualité — ${dette.nom}`,
                montant: Number(dette.mensualite),
                type: 'depense',
                date: dateEcheance,
                recurrente: true,
                recurrence_modele: false,
                recurrence_active: true,
                jour_recurrence: jour,
                source: 'dette_auto',
                dette_id: dette.id,
            })

            // Déduire le solde du compte associé
            const { data: compte } = await supabase
                .from('comptes')
                .select('solde')
                .eq('id', dette.compte_id)
                .single()
            if (compte) {
                await supabase
                    .from('comptes')
                    .update({ solde: Number(compte.solde) - Number(dette.mensualite) })
                    .eq('id', dette.compte_id)
            }
        }
    }, [annee, mois, debutMois, finMois, user])

    const charger = useCallback(async () => {
        setLoading(true)
        await genererRecurrentes()
        await genererMensualitesDettes()
        await genererLoyersImmo()

        const { data, error } = await supabase
            .from('transactions')
            .select('*, comptes(nom, couleur), categories(nom, couleur)')
            .eq('user_id', user.id)
            .gte('date', debutMois)
            .lte('date', finMois)
            .order('date', { ascending: false })

        if (!error) setTransactions(data)
        setLoading(false)
    }, [debutMois, finMois, genererRecurrentes, genererMensualitesDettes, genererLoyersImmo, user])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterTransaction = async (transaction) => {
        const groupeId = transaction.recurrente ? crypto.randomUUID() : null
        const { error } = await supabase.from('transactions').insert({
            ...transaction,
            user_id: user.id,
            recurrence_groupe_id: groupeId,
            recurrence_modele: Boolean(transaction.recurrente),
            recurrence_active: true,
        })
        if (!error) await charger()
        return { error }
    }

    const supprimerTransaction = async (id, supprimerSerie = false) => {
        const { data: transaction } = await supabase.from('transactions').select('recurrence_groupe_id').eq('id', id).maybeSingle()
        let query = supabase.from('transactions').delete().eq('id', id)
        if (supprimerSerie && transaction?.recurrence_groupe_id) {
            query = supabase.from('transactions').delete().eq('recurrence_groupe_id', transaction.recurrence_groupe_id)
        }
        const { error } = await query
        if (!error) await charger()
        return { error }
    }

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