import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function usePagesTourVues() {
    const { user, profile, refreshProfile } = useAuth()
    const pagesVues = profile?.pages_tour_vues || []

    const dejaVue = useCallback(
        (route) => pagesVues.includes(route),
        [pagesVues]
    )

    const marquerPageVue = useCallback(
        async (route) => {
            if (!user || !route || pagesVues.includes(route)) return
            const nouvellesPages = [...pagesVues, route]
            // Mise à jour optimiste + persistance en base
            const { error } = await supabase
                .from('profiles')
                .update({ pages_tour_vues: nouvellesPages })
                .eq('id', user.id)
            if (!error) await refreshProfile()
        },
        [user, pagesVues, refreshProfile]
    )

    return { pagesVues, dejaVue, marquerPageVue }
}
