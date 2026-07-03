import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculateCryptoRealizedPL, calculatePRU } from '../lib/financialCalculations'

export function usePositionsCrypto() {
    const { user } = useAuth()
    const [positions, setPositions] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [historicalData, setHistoricalData] = useState([])
    const [timeFilter, setTimeFilter] = useState('7j') // '7j', '30j', '1an', 'tout'

    const charger = useCallback(async () => {
        if (!user) return
        
        setLoading(true)
        
        try {
            // Load crypto positions
            const { data: positionsData, error: positionsError } = await supabase
                .from('positions_crypto')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
            
            // Load crypto transactions
            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transactions_crypto')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
            
            // Load historical portfolio values
            const { data: historicalData, error: historicalError } = await supabase
                .from('historique_valeur_crypto')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
            
            if (!positionsError) setPositions(positionsData || [])
            if (!transactionsError) setTransactions(transactionsData || [])
            if (!historicalError) setHistoricalData(historicalData || [])
        } catch (error) {
            console.error('Error loading crypto positions:', error)
        }
        
        setLoading(false)
    }, [user])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterPosition = async (position) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('positions_crypto')
            .insert({ ...position, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    const supprimerPosition = async (id) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('positions_crypto')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Add a new crypto transaction (buy or sell)
     * @param {Object} transaction - Transaction data
     * @returns {Promise<Object>} Result with error if any
     */
    const ajouterTransaction = async (transaction) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('transactions_crypto')
            .insert({ 
                ...transaction, 
                user_id: user.id,
                coin_id: transaction.coin_id,
                symbole: transaction.symbole,
                nom: transaction.nom
            })
        if (!error) await charger()
        return { error }
    }

    /**
     * Delete a crypto transaction
     * @param {string} id - Transaction ID
     * @returns {Promise<Object>} Result with error if any
     */
    const supprimerTransaction = async (id) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('transactions_crypto')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
        if (!error) await charger()
        return { error }
    }

    /**
     * Calculate realized P&L using French PRU method
     * @returns {Object} P&L calculation results
     */
    const calculerPnLRealise = useCallback(() => {
        return calculateCryptoRealizedPL(transactions)
    }, [transactions])

    /**
     * Calculate current PRU (Prix de Revient Unitaire) for the portfolio
     * @returns {number} Current PRU value
     */
    const calculerPRUActuel = useCallback(() => {
        return calculatePRU(positions)
    }, [positions])

    /**
     * Get filtered historical data based on time filter
     * @returns {Array} Filtered historical data
     */
    const getHistoricalDataFiltered = useCallback(() => {
        const now = new Date()
        
        return historicalData.filter(h => {
            const date = new Date(h.date)
            
            switch (timeFilter) {
                case '7j':
                    return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                case '30j':
                    return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                case '1an':
                    return date >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                case 'tout':
                default:
                    return true
            }
        })
    }, [historicalData, timeFilter])

    /**
     * Set time filter for historical data
     * @param {string} filter - Time filter ('7j', '30j', '1an', 'tout')
     */
    const setPeriode = useCallback((filter) => {
        setTimeFilter(filter)
    }, [])

    /**
     * Save current portfolio value to history
     * @param {number} value - Current portfolio value
     */
    const sauvegarderValeurHistorique = async (value) => {
        if (!user) return { error: new Error('User not authenticated') }
        
        const { error } = await supabase
            .from('historique_valeur_crypto')
            .insert({
                user_id: user.id,
                valeur: value,
                date: new Date().toISOString()
            })
        
        if (!error) await charger()
        return { error }
    }

    return {
        positions,
        transactions,
        loading,
        historicalData,
        timeFilter,
        ajouterPosition,
        supprimerPosition,
        ajouterTransaction,
        supprimerTransaction,
        calculerPnLRealise,
        calculerPRUActuel,
        getHistoricalDataFiltered,
        setPeriode,
        sauvegarderValeurHistorique,
        charger
    }
}
