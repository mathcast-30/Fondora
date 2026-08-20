import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEntiteMembres(entiteId) {
    const [repartition, setRepartition] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!entiteId) { setRepartition([]); setLoading(false); return }
        setLoading(true)
        const { data, error } = await supabase
            .from('entite_membres')
            .select('*, membre:membre_entite_id(id, nom, couleur)')
            .eq('entite_id', entiteId)
        if (!error) setRepartition(data || [])
        setLoading(false)
    }, [entiteId])

    useEffect(() => { charger() }, [charger])

    const ajouterPart = async ({ membre_entite_id, pourcentage, type_detention }) => {
        const { error } = await supabase.from('entite_membres').insert({
            entite_id: entiteId, membre_entite_id, pourcentage: parseFloat(pourcentage), type_detention,
        })
        if (!error) await charger()
        return { error }
    }
    const modifierPart = async (id, updates) => {
        const { error } = await supabase.from('entite_membres').update(updates).eq('id', id)
        if (!error) await charger()
        return { error }
    }
    const supprimerPart = async (id) => {
        const { error } = await supabase.from('entite_membres').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    const totalPourcentage = repartition.reduce((s, r) => s + Number(r.pourcentage), 0)
    return { repartition, loading, ajouterPart, modifierPart, supprimerPart, totalPourcentage, rafraichir: charger }
}