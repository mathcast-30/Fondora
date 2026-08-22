import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Historique des intérêts déjà versés sur un livret (fiche façon relevé annuel)
export function useInteretsLivret(compteId) {
    const [historique, setHistorique] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!compteId) { setLoading(false); return }
        setLoading(true)
        const { data } = await supabase
            .from('interets_livrets_historique')
            .select('id, annee, taux_moyen_pondere, montant_interets, date_calcul, detail_quinzaines')
            .eq('compte_id', compteId)
            .order('annee', { ascending: false })
        setHistorique(data || [])
        setLoading(false)
    }, [compteId])

    useEffect(() => { charger() }, [charger])

    const totalPercu = historique.reduce((s, h) => s + Number(h.montant_interets), 0)

    return { historique, totalPercu, loading, recharger: charger }
}

// Récupère en une seule requête la liste des comptes ayant déjà un historique
// d'intérêts (utile pour savoir si on doit proposer "clôturer" plutôt que "supprimer",
// sans appeler un hook par compte dans une boucle ou conditionnellement).
export function useInteretsLivretsTous() {
    const { user } = useAuth()
    const [comptesAvecHistorique, setComptesAvecHistorique] = useState(new Set())

    useEffect(() => {
        if (!user) return
        supabase.from('interets_livrets_historique').select('compte_id')
            .then(({ data }) => {
                setComptesAvecHistorique(new Set((data || []).map((h) => h.compte_id)))
            })
    }, [user])

    return comptesAvecHistorique
}