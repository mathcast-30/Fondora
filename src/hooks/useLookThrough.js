import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLookThrough(positions) {
    const [compositions, setCompositions] = useState({})
    const [loading, setLoading] = useState(true)

    const tickers = [...new Set((positions || []).map(p => p.symbole || p.ticker).filter(Boolean))]
    const cleTickers = tickers.join(',')

    useEffect(() => {
        if (tickers.length === 0) { setCompositions({}); setLoading(false); return }
        let annule = false
        setLoading(true)
        supabase.from('etf_composition').select('*').in('ticker', tickers).then(({ data }) => {
            if (annule) return
            const parTicker = {}
            for (const row of data || []) {
                if (!parTicker[row.ticker]) parTicker[row.ticker] = { geographique: [], sectoriel: [] }
                parTicker[row.ticker][row.dimension].push(row)
            }
            setCompositions(parTicker)
            setLoading(false)
        })
        return () => { annule = true }
    }, [cleTickers])

    const getValeurPosition = (p) => {
        if (p.valeurMarche !== undefined) return p.valeurMarche || 0
        if (p.valeur_actuelle !== undefined) return p.valeur_actuelle || 0
        if (p.valeurActuelle !== undefined) return p.valeurActuelle || 0
        const qte = Number(p.quantite) || 0
        const prix = Number(p.coursActuel ?? p.cours ?? p.prix_achat_moyen ?? 0)
        return qte * prix
    }

    const valeurTotale = (positions || []).reduce((s, p) => s + getValeurPosition(p), 0)

    const calculerRepartition = (dimension) => {
        const acc = {}
        let valeurCouverte = 0
        for (const p of positions || []) {
            const t = p.symbole || p.ticker
            const val = getValeurPosition(p)
            const comp = compositions[t]?.[dimension]
            if (comp && comp.length > 0) {
                valeurCouverte += val
                for (const ligne of comp) {
                    acc[ligne.libelle] = (acc[ligne.libelle] || 0) + val * (ligne.pourcentage / 100)
                }
            }
        }
        const valeurNonCouverte = Math.max(0, valeurTotale - valeurCouverte)
        if (valeurNonCouverte > 0.01) acc['Non couvert'] = (acc['Non couvert'] || 0) + valeurNonCouverte

        const total = Object.values(acc).reduce((s, v) => s + v, 0) || 1
        const lignes = Object.entries(acc)
            .map(([libelle, valeur]) => ({ libelle, valeur, pourcentage: Math.round((valeur / total) * 1000) / 10 }))
            .sort((a, b) => b.valeur - a.valeur)
        const tauxCouverture = valeurTotale > 0 ? Math.round((valeurCouverte / valeurTotale) * 100) : 0
        return { lignes, tauxCouverture }
    }

    return {
        loading,
        geo: calculerRepartition('geographique'),
        secteur: calculerRepartition('sectoriel'),
    }
}