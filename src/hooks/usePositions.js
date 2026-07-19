import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculateFIFOPnL, calculateXIRR, calculateCAGR } from '../lib/financialCalculations'

export function usePositions() {
    const { user } = useAuth()
    const [positions, setPositions] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [displayMode, setDisplayMode] = useState('euro') // 'euro' or 'percentage'

    const charger = useCallback(async () => {
        if (!user) return
        
        setLoading(true)
        
        try {
            // Load positions
            const { data: positionsData, error: positionsError } = await supabase
                .from('positions_financieres')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
            
            // Load investment transactions
            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions_investissement')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
            
            if (!positionsError) setPositions(positionsData || [])
            if (!transactionsError) setTransactions(transactionsData || [])
        } catch (error) {
            console.error('Error loading positions:', error)
        }
        
        setLoading(false)
    }, [user])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterPosition = async (position) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('positions_financieres')
            .insert({ ...position, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    const modifierPosition = async (id, updates) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('positions_financieres')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
        if (!error) await charger()
        return { error }
    }

    const supprimerPosition = async (id) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('positions_financieres')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Add a new investment transaction (buy or sell)
     * @param {Object} transaction - Transaction data
     * @returns {Promise<Object>} Result with error if any
     */
    const ajouterTransaction = async (transaction) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        try {
            const symbolUpper = transaction.symbole?.toUpperCase()
            const typeCompte = transaction.type_compte || 'PEA'
            const isBuy = transaction.type === 'buy'
            const quantiteTx = parseFloat(transaction.quantite)
            const prixTx = parseFloat(transaction.prix_unitaire)

            // 1. Find existing position
            const { data: existingPositions, error: findError } = await supabase
                .from('positions_financieres')
                .select('*')
                .eq('user_id', user.id)
                .eq('symbole', symbolUpper)
                .eq('type_compte', typeCompte)

            if (findError) throw findError

            let positionId = null
            const pos = existingPositions && existingPositions[0]

            if (pos) {
                positionId = pos.id
                const quantiteExistante = parseFloat(pos.quantite)
                const pruExistant = parseFloat(pos.prix_achat_moyen)
                let nouvelleQuantite = quantiteExistante
                let nouveauPru = pruExistant

                if (isBuy) {
                    nouvelleQuantite = quantiteExistante + quantiteTx
                    nouveauPru = ((quantiteExistante * pruExistant) + (quantiteTx * prixTx)) / nouvelleQuantite
                } else {
                    nouvelleQuantite = Math.max(0, quantiteExistante - quantiteTx)
                }

                if (nouvelleQuantite <= 0) {
                    const { error: deleteError } = await supabase
                        .from('positions_financieres')
                        .delete()
                        .eq('id', pos.id)
                    if (deleteError) throw deleteError
                } else {
                    const { error: updateError } = await supabase
                        .from('positions_financieres')
                        .update({
                            quantite: nouvelleQuantite,
                            prix_achat_moyen: nouveauPru
                        })
                        .eq('id', pos.id)
                    if (updateError) throw updateError
                }
            } else if (isBuy) {
                const { data: newPos, error: insertPosError } = await supabase
                    .from('positions_financieres')
                    .insert({
                        user_id: user.id,
                        symbole: symbolUpper,
                        nom: transaction.nom || symbolUpper,
                        quantite: quantiteTx,
                        prix_achat_moyen: prixTx,
                        devise: transaction.devise || 'EUR',
                        type_compte: typeCompte,
                        secteur: transaction.secteur || null,
                        date_achat: transaction.date
                    })
                    .select()
                    .single()

                if (insertPosError) throw insertPosError
                positionId = newPos.id
            }

            // 2. Insert transaction
            const { error: txError } = await supabase
                .from('transactions_investissement')
                .insert({ 
                    user_id: user.id,
                    position_id: positionId,
                    type: transaction.type,
                    symbole: symbolUpper,
                    quantite: quantiteTx,
                    prix_unitaire: prixTx,
                    date: transaction.date
                })

            if (txError) throw txError

            await charger()
            return { error: null }
        } catch (err) {
            console.error('Error in ajouterTransaction:', err)
            return { error: err }
        }
    }

    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     * @returns {Promise<Object>} Result with error if any
     */
    const supprimerTransaction = async (id) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('transactions_investissement')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Calculate realized P&L using FIFO/PEPS method
     * @returns {Object} P&L calculation results
     */
    const calculerPnLRealise = useCallback(() => {
        return calculateFIFOPnL(transactions)
    }, [transactions])

    /**
     * Calculate XIRR/TRI for positions
     * @param {string} symbole - Stock symbol to calculate for
     * @returns {number|null} XIRR value or null
     */
    const calculerXIRR = useCallback((symbole) => {
        const symbolTransactions = transactions.filter(t => t.symbole?.toUpperCase() === symbole?.toUpperCase())
        if (symbolTransactions.length < 2) return null
        
        const cashFlows = symbolTransactions.map(t => ({
            date: t.date,
            amount: t.type === 'buy' ? -t.quantity * t.price : t.quantity * t.price
        }))
        
        return calculateXIRR(cashFlows)
    }, [transactions])

    /**
     * Calculate CAGR for a position
     * @param {Object} position - Position data
     * @param {number} years - Number of years held
     * @returns {number} CAGR value
     */
    const calculerCAGR = useCallback((position, years) => {
        const initialValue = position.prix_achat_moyen * position.quantite
        const currentValue = position.valeur_actuelle || (position.prix_achat_moyen * position.quantite)
        return calculateCAGR(initialValue, currentValue, years)
    }, [])

    /**
     * Toggle between euro and percentage display
     */
    const toggleDisplayMode = useCallback(() => {
        setDisplayMode(prev => prev === 'euro' ? 'percentage' : 'euro')
    }, [])

    return {
        positions,
        transactions,
        loading,
        ajouterPosition,
        modifierPosition,
        supprimerPosition,
        ajouterTransaction,
        supprimerTransaction,
        calculerPnLRealise,
        calculerXIRR,
        calculerCAGR,
        displayMode,
        toggleDisplayMode,
        charger
    }
}
