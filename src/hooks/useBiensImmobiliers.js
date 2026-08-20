import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useEntiteFiltre } from '../context/EntiteContext'
import { useFoyerActif } from '../context/FoyerContext'
import { calculerRentabilite } from '../lib/calculImmo'
import { toastError } from '../utils/toast'

export function useBiensImmobiliers() {
    const { user } = useAuth()
    const { entiteFiltre } = useEntiteFiltre()
    const { ownerUserIdActif } = useFoyerActif()
    const [biens, setBiens] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('biens_immobiliers').select('*').order('created_at', { ascending: true })
        if (ownerUserIdActif) query = query.eq('user_id', ownerUserIdActif)
        if (entiteFiltre) query = query.eq('entite_id', entiteFiltre)
        const { data, error } = await query
        if (!error) setBiens(data || [])
        setLoading(false)
    }, [entiteFiltre, ownerUserIdActif])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterBien = async (bien) => {
        const { data, error } = await supabase
            .from('biens_immobiliers')
            .insert({ ...bien, user_id: ownerUserIdActif })
            .select()
            .single()
        if (error) { toastError(error.message) } else { await charger() }
        return { data, error }
    }

    const modifierBien = async (id, updates) => {
        const { error } = await supabase
            .from('biens_immobiliers')
            .update(updates)
            .eq('id', id)
        if (error) { toastError(error.message) } else { await charger() }
        return { error }
    }

    const supprimerBien = async (id) => {
        const { error } = await supabase.from('biens_immobiliers').delete().eq('id', id)
        if (error) { toastError(error.message) } else { await charger() }
        return { error }
    }

    // Valeur totale du patrimoine immobilier
    const valeurTotaleImmo = biens.reduce((acc, b) => {
        const { valeurNette } = calculerRentabilite(b)
        return acc + valeurNette
    }, 0)
    return { biens, loading, ajouterBien, modifierBien, supprimerBien, valeurTotaleImmo, rafraichir: charger }
}