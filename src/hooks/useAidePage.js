import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Petit cache en mémoire pour éviter de re-fetch la même page plusieurs fois par session
const cache = {}

export function useAidePage(route) {
    const [aide, setAide] = useState(cache[route] || null)
    const [loading, setLoading] = useState(!cache[route])
    const [error, setError] = useState(null)

    const fetchAide = useCallback(async () => {
        if (!route) return
        if (cache[route]) {
            setAide(cache[route])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('aide_pages')
            .select('titre, vue_ensemble, glossaire, mode_emploi')
            .eq('route', route)
            .maybeSingle()

        if (error) {
            setError(error)
        } else if (data) {
            cache[route] = data
            setAide(data)
        }
        setLoading(false)
    }, [route])

    useEffect(() => {
        fetchAide()
    }, [fetchAide])

    return { aide, loading, error }
}
