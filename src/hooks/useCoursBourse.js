import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Récupère les cours actuels pour une liste de symboles boursiers
export function useCoursBourse(symboles) {
    const [cours, setCours] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!symboles || symboles.length === 0) return

        const chargerCours = async () => {
            setLoading(true)
            const resultats = {}

            for (const symbole of symboles) {
                const { data, error } = await supabase.functions.invoke('cours-bourse', {
                    body: { symbole },
                })
                if (!error && data) {
                    resultats[symbole] = data
                }
            }

            setCours(resultats)
            setLoading(false)
        }

        chargerCours()
    }, [JSON.stringify(symboles)])

    return { cours, loading }
}