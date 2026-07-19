import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculerEstimationParPosition, totalEstimationAnnuelle } from '../utils/estimationDividendes'

export function useEstimationDividendes(positions) {
    const [catalogueParTicker, setCatalogueParTicker] = useState({})
    const [loading, setLoading] = useState(true)
    const [actualisation, setActualisation] = useState(false)

    const symboles = [...new Set((positions || []).map((p) => p.symbole?.toUpperCase()).filter(Boolean))]

    const charger = useCallback(async () => {
        if (symboles.length === 0) {
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase
            .from('catalogue_actifs')
            .select('ticker, dividende_annuel_par_action, dividende_updated_at, devise')
            .in('ticker', symboles)

        const map = {}
        for (const row of data || []) {
            map[row.ticker.toUpperCase()] = row
        }
        setCatalogueParTicker(map)
        setLoading(false)
    }, [JSON.stringify(symboles)])

    useEffect(() => { charger() }, [charger])

    // Déclenche la mise à jour Finnhub pour les tickers connus, en séquentiel pour respecter le rate limit
    const actualiserEstimations = async () => {
        if (symboles.length === 0) return
        setActualisation(true)
        for (const ticker of symboles) {
            await supabase.functions.invoke('dividende-bourse', { body: { ticker } })
        }
        await charger()
        setActualisation(false)
    }

    const positionsEstimees = calculerEstimationParPosition(positions, catalogueParTicker)
    const totalAnnuel = totalEstimationAnnuelle(positionsEstimees)

    return { positionsEstimees, totalAnnuel, loading, actualisation, actualiserEstimations }
}