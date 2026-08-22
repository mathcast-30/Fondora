import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STRUCTURES = ['sci', 'sas', 'eurl', 'joint', 'indivision']

export function useEntiteInfo(entiteId) {
    const [entite, setEntite] = useState(null)
    const [repartition, setRepartition] = useState([])
    const [loading, setLoading] = useState(!!entiteId)

    useEffect(() => {
        if (!entiteId) { setEntite(null); setRepartition([]); setLoading(false); return }
        let annule = false
        setLoading(true)
            ; (async () => {
                const { data: e } = await supabase.from('entites').select('*').eq('id', entiteId).maybeSingle()
                if (annule) return
                setEntite(e || null)
                if (e && STRUCTURES.includes(e.type)) {
                    const { data: r } = await supabase.from('entite_membres')
                        .select('*, membre:membre_entite_id(id, nom, couleur)').eq('entite_id', entiteId)
                    if (!annule) setRepartition(r || [])
                } else setRepartition([])
                setLoading(false)
            })()
        return () => { annule = true }
    }, [entiteId])

    return { entite, repartition, loading, estStructure: entite ? STRUCTURES.includes(entite.type) : false }
}