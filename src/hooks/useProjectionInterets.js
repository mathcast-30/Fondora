import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { calculerInteretsLivret, getDateValeurPourAffichage } from '../utils/interetsLivrets'
import { useTauxReglementes } from './useTauxReglementes'
import { useTauxLivretJeune } from './useTauxLivretJeune'

const TYPE_CODE = { 'livret a': 'LIVRET_A', 'ldds': 'LDDS', 'lep': 'LEP', 'livret jeune': 'LIVRET_JEUNE' }

export function useProjectionInterets(compte) {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const annee = new Date().getFullYear()

    const typeCode = compte ? TYPE_CODE[(compte.type || '').trim().toLowerCase()] : null

    const { getHistoriquePourType } = useTauxReglementes()
    const { historique: historiqueLivretJeune } = useTauxLivretJeune(typeCode === 'LIVRET_JEUNE' ? compte?.id : null)

    useEffect(() => {
        const charger = async () => {
            if (!compte?.id) { setLoading(false); return }
            setLoading(true)
            const { data } = await supabase
                .from('transactions')
                .select('date, montant, type')
                .eq('compte_id', compte.id)
            setTransactions(data || [])
            setLoading(false)
        }
        charger()
    }, [compte?.id])

    const tauxHistorique = useMemo(() => {
        if (!typeCode) return []
        if (typeCode === 'LIVRET_JEUNE') {
            return historiqueLivretJeune.map((t) => ({ date_effet: t.date_effet, taux: Number(t.taux) }))
        }
        return getHistoriquePourType(typeCode).map((t) => ({ date_effet: t.date_effet, taux: Number(t.taux) }))
    }, [typeCode, historiqueLivretJeune, getHistoriquePourType])

    const dateOuverture = compte?.created_at ? compte.created_at.slice(0, 10) : `${annee}-01-01`
    const signe = (t) => (t.type === 'depense' ? -1 : 1) * Number(t.montant)

    // Le solde de départ du compte est traité comme un versement fait à la date
    // d'ouverture, pas comme "de l'argent déjà là au 1er janvier" - important pour
    // les livrets créés en cours d'année avec un solde initial non nul.
    const ledgerComplet = useMemo(() => {
        if (!compte) return []
        const versementInitial = { date: dateOuverture, montant: Number(compte.solde) || 0 }
        return [versementInitial, ...transactions.map((t) => ({ date: t.date, montant: signe(t) }))]
    }, [compte, transactions, dateOuverture])

    const soldeInitial = useMemo(() => (
        ledgerComplet.filter((m) => m.date < `${annee}-01-01`).reduce((s, m) => s + m.montant, 0)
    ), [ledgerComplet, annee])

    const transactionsAnnee = useMemo(() => (
        ledgerComplet.filter((m) => m.date >= `${annee}-01-01` && m.date <= `${annee}-12-31`)
    ), [ledgerComplet, annee])

    // Projection à date d'aujourd'hui : ce qui a déjà été gagné + ce qui sera gagné
    // d'ici le 31/12 si le solde actuel ne bouge plus.
    const projection = useMemo(() => {
        if (!typeCode || tauxHistorique.length === 0) return null
        return calculerInteretsLivret({ soldeInitial, dateOuverture, transactions: transactionsAnnee, tauxHistorique, annee })
    }, [typeCode, soldeInitial, dateOuverture, transactionsAnnee, tauxHistorique, annee])

    // Simule l'ajout d'un versement/retrait hypothétique à une date donnée et renvoie
    // le supplément d'intérêts que ce mouvement générerait d'ici la fin de l'année.
    const simulerVersement = useCallback((montant, date) => {
        if (!typeCode || tauxHistorique.length === 0 || !montant || !date) return null
        const transactionsSimulees = [...transactionsAnnee, { date, montant: parseFloat(montant) }]
        const resultat = calculerInteretsLivret({ soldeInitial, dateOuverture, transactions: transactionsSimulees, tauxHistorique, annee })
        const interetSupplementaire = projection ? Math.round((resultat.montantInterets - projection.montantInterets) * 100) / 100 : null
        const dateValeur = getDateValeurPourAffichage(date, parseFloat(montant))
        return { montantInterets: resultat.montantInterets, interetSupplementaire, dateValeur }
    }, [typeCode, soldeInitial, dateOuverture, transactionsAnnee, tauxHistorique, annee, projection])

    return { projection, simulerVersement, loading, annee, typeCode }
}