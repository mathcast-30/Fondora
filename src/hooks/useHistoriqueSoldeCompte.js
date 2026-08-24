import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Reconstruit l'évolution du solde d'un compte à partir de ses transactions
// (pas besoin de table d'historique séparée : solde de départ + mouvements cumulés).
export function useHistoriqueSoldeCompte(compte) {
    const [points, setPoints] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const charger = async () => {
            if (!compte?.id) { setLoading(false); return }
            setLoading(true)
            const { data } = await supabase
                .from('transactions')
                .select('date, montant, type')
                .eq('compte_id', compte.id)
                .order('date', { ascending: true })

            const dateOuverture = (compte.created_at || '').slice(0, 10)
            const signe = (t) => (t.type === 'depense' ? -1 : 1) * Number(t.montant)

            // compte.solde est déjà le solde courant (trigger DB) : on retrouve le
            // montant de départ en retirant l'effet cumulé de toutes les transactions,
            // puis on rejoue la chronologie pour reconstruire l'historique.
            const effetTotal = (data || []).reduce((s, t) => s + signe(t), 0)
            let solde = (Number(compte.solde) || 0) - effetTotal
            const serie = [{ date: dateOuverture, solde: Math.round(solde * 100) / 100 }]
            ;(data || []).forEach((t) => {
                solde += signe(t)
                serie.push({ date: t.date, solde: Math.round(solde * 100) / 100 })
            })
            // Point final = solde réel actuel (couvre l'écart si des positions d'investissement
            // sont incluses dans soldeReel mais pas dans les transactions brutes)
            serie.push({ date: new Date().toISOString().slice(0, 10), solde: compte.soldeReel ?? solde })

            setPoints(serie.slice(-30)) // les 30 derniers points suffisent pour un sparkline
            setLoading(false)
        }
        charger()
    }, [compte?.id, compte?.soldeReel])

    const tendance = points.length >= 2
        ? (points[points.length - 1].solde >= points[0].solde ? 'hausse' : 'baisse')
        : null

    return { points, tendance, loading }
}