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
        setLoading(true)
        
        try {
            // Load positions
            const { data: positionsData, error: positionsError } = await supabase
                .from('positions_financieres')
                .select('*')
                .order('created_at', { ascending: true })
            
            // Load investment transactions
            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions_investissement')
                .select('*')
                .order('date', { ascending: true })
            
            if (!positionsError) setPositions(positionsData || [])
            if (!transactionsError) setTransactions(transactionsData || [])
        } catch (error) {
            console.error('Error loading positions:', error)
        }
        
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterPosition = async (position) => {
        const { error } = await supabase
            .from('positions_financieres')
            .insert({ ...position, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    const supprimerPosition = async (id) => {
        const { error } = await supabase.from('positions_financieres').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Add a new investment transaction (buy or sell)
     * @param {Object} transaction - Transaction data
     * @returns {Promise<Object>} Result with error if any
     */
    const ajouterTransaction = async (transaction) => {
        const { error } = await supabase
            .from('transactions_investissement')
            .insert({ 
                ...transaction, 
                user_id: user.id,
                date: transaction.date || new Date().toISOString()
            })
        if (!error) await charger()
        return { error }
    }

    /**
     * Calculate realized P&L using FIFO/PEPS method
     * @returns {Object} P&L calculation results
     */
    const calculerPnLRealise = useCallback(() => {
        return calculateFIFOPnL(transactions);
    }, [transactions])

    /**
     * Calculate XIRR/TRI for positions
     * @param {string} symbole - Stock symbol to calculate for
     * @returns {number|null} XIRR value or null
     */
    const calculerXIRR = useCallback((symbole) => {
        const symbolTransactions = transactions.filter(t => t.symbole === symbole);
        if (symbolTransactions.length < 2) return null;
        
        const cashFlows = symbolTransactions.map(t => ({
            date: t.date,
            amount: t.type === 'buy' ? -t.quantity * t.price : t.quantity * t.price
        }));
        
        return calculateXIRR(cashFlows);
    }, [transactions])

    /**
     * Calculate CAGR for a position
     * @param {Object} position - Position data
     * @param {number} years - Number of years held
     * @returns {number} CAGR value
     */
    const calculerCAGR = useCallback((position, years) => {
        const initialValue = position.prix_achat_moyen * position.quantite;
        const currentValue = position.valeur_actuelle || (position.prix_achat_moyen * position.quantite);
        return calculateCAGR(initialValue, currentValue, years);
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
        supprimerPosition,
        ajouterTransaction,
        calculerPnLRealise,
        calculerXIRR,
        calculerCAGR,
        displayMode,
        toggleDisplayMode,
        charger
    }
}
