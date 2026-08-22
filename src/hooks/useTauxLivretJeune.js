import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Taux propre à un compte Livret Jeune (fixé librement par chaque banque)
export function useTauxLivretJeune(compteId) {
    const { user } = useAuth()
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!compteId) { setLoading(false); return }
        setLoading(true)
        const { data } = await supabase
            .from('taux_livret_jeune_historique')
            .select('id, taux, date_effet')
            .eq('compte_id', compteId)
            .order('date_effet', { ascending: false })
        setHistorique(data || [])
        setLoading(false)
    }, [compteId])

    useEffect(() => { charger() }, [charger])

    const tauxActuel = historique.length > 0 ? Number(historique[0].taux) : null

    // Ajoute une nouvelle ligne de taux (ne modifie jamais une ligne existante,
    // pour que le calcul par quinzaines reste juste si le taux change en cours d'année)
    const definirNouveauTaux = async (taux, dateEffet = new Date().toISOString().slice(0, 10)) => {
        const { error } = await supabase
            .from('taux_livret_jeune_historique')
            .upsert({ compte_id: compteId, user_id: user.id, taux: parseFloat(taux), date_effet: dateEffet }, { onConflict: 'compte_id,date_effet' })
        if (!error) await charger()
        return { error }
    }

    return { historique, tauxActuel, loading, definirNouveauTaux, recharger: charger }
}

// Récupère le taux actuel de TOUS les Livret Jeune de l'utilisateur en une requête
// (utile pour des calculs agrégés sans multiplier les instances de hook).
export function useTauxLivretJeuneTous() {
    const { user } = useAuth()
    const [parCompte, setParCompte] = useState({})

    useEffect(() => {
        if (!user) return
        supabase.from('taux_livret_jeune_historique').select('compte_id, taux, date_effet')
            .then(({ data }) => {
                const dernier = {}
                ;(data || []).forEach((t) => {
                    if (!dernier[t.compte_id] || t.date_effet > dernier[t.compte_id].date_effet) dernier[t.compte_id] = t
                })
                const resultat = {}
                Object.entries(dernier).forEach(([id, t]) => { resultat[id] = Number(t.taux) })
                setParCompte(resultat)
            })
    }, [user])

    return parCompte
}