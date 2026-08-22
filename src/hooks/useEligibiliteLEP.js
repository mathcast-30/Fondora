import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Plafonds RFR 2026 (source service-public.fr) - simplifié à 1 part / 2 parts,
// ne tient pas compte des enfants à charge (demi-part supplémentaire).
const PLAFOND_RFR_LEP = { celibataire: 23028, marie_pacse: 35326 }

export function useEligibiliteLEP() {
    const { user } = useAuth()
    const [rfr, setRfr] = useState(null)
    const [situationFamiliale, setSituationFamiliale] = useState('celibataire')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const charger = async () => {
            if (!user) { setLoading(false); return }
            const { data } = await supabase.from('profiles').select('rfr, situation_familiale').eq('id', user.id).single()
            if (data) {
                setRfr(data.rfr != null ? Number(data.rfr) : null)
                setSituationFamiliale(data.situation_familiale || 'celibataire')
            }
            setLoading(false)
        }
        charger()
    }, [user])

    const plafond = PLAFOND_RFR_LEP[situationFamiliale] || PLAFOND_RFR_LEP.celibataire
    const rfrRenseigne = rfr != null
    const eligible = rfrRenseigne ? rfr <= plafond : null // null = on ne sait pas (RFR non renseigné)

    return { rfr, plafond, eligible, rfrRenseigne, loading }
}