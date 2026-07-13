import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useConsentement() {
    const { user } = useAuth()
    const [consentements, setConsentements] = useState([])
    const [loading, setLoading] = useState(true)

    const chargerConsentements = useCallback(async () => {
        if (!user) {
            setConsentements([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('consentements')
            .select('*')
            .eq('user_id', user.id)
        if (!error && data) {
            setConsentements(data)
        }
        setLoading(false)
    }, [user])

    useEffect(() => {
        chargerConsentements()
    }, [user, chargerConsentements])

    const enregistrerConsentement = async (type, version) => {
        if (!user) return { error: new Error("Utilisateur non connecté") }
        
        const newConsent = {
            user_id: user.id,
            type,
            version,
            accepte: true,
            user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
        }

        const { data, error } = await supabase
            .from('consentements')
            .insert(newConsent)
            .select()

        if (!error) {
            await chargerConsentements()
        }
        return { data, error }
    }

    const aConsentement = useCallback((type, version) => {
        if (!user) return false
        return consentements.some(
            (c) => c.type === type && c.version === version && c.accepte === true
        )
    }, [user, consentements])

    return {
        consentements: user ? consentements : null,
        loading: user ? loading : false,
        enregistrerConsentement,
        aConsentement
    }
}
