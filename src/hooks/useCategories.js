import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useCategories() {
    const { user } = useAuth()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('categories_visibles')
            .select('*')
            .order('nom', { ascending: true })
        if (!error && data) setCategories(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (user) charger()
    }, [user, charger])

    const ajouterCategorie = async (categorie) => {
        const { error } = await supabase
            .from('categories')
            .insert({ ...categorie, user_id: user.id })
        if (!error) await charger()
        return { error }
    }

    // Supprime une catégorie perso, ou masque une catégorie globale
    const supprimerCategorie = async (id) => {
        const cat = categories.find((c) => c.id === id)
        if (!cat) return { error: new Error('Catégorie introuvable') }

        if (cat.user_id === null) {
            // Catégorie globale → on la masque, on ne la supprime pas
            const { error } = await supabase
                .from('categories_masquees')
                .insert({ user_id: user.id, categorie_id: id })
            if (!error) await charger()
            return { error }
        }

        // Catégorie perso → suppression réelle
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { categories, loading, ajouterCategorie, supprimerCategorie, charger }
}