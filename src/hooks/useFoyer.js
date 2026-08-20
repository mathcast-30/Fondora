import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function genererToken() {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function useFoyer() {
    const { user } = useAuth()
    const [foyer, setFoyer] = useState(null)
    const [membres, setMembres] = useState([])
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        let { data: f } = await supabase.from('foyers').select('*').eq('createur_user_id', user.id).maybeSingle()
        if (!f) {
            const { data: nouveau } = await supabase.from('foyers').insert({ createur_user_id: user.id, nom: 'Mon foyer' }).select().single()
            f = nouveau
        }
        setFoyer(f)
        if (f) {
            const { data: m } = await supabase.from('foyer_membres').select('*, entites(nom)').eq('foyer_id', f.id).order('created_at')
            setMembres(m || [])
        }
        setLoading(false)
    }, [user])

    useEffect(() => { charger() }, [charger])

    const inviterMembre = async ({ email_invite, entite_geree_id, niveau_acces, peut_gerer_membres }) => {
        if (!foyer) return { error: new Error('Foyer introuvable') }
        const token = genererToken()
        const { error } = await supabase.from('foyer_membres').insert({
            foyer_id: foyer.id, email_invite: email_invite.trim().toLowerCase(),
            entite_geree_id, niveau_acces, peut_gerer_membres: !!peut_gerer_membres,
            token_invitation: token, statut: 'invite',
        })
        if (!error) await charger()
        return { error, token }
    }

    const modifierMembre = async (id, updates) => {
        const { error } = await supabase.from('foyer_membres').update(updates).eq('id', id)
        if (!error) await charger()
        return { error }
    }

    const retirerMembre = async (id) => {
        const { error } = await supabase.from('foyer_membres').update({ statut: 'retire', user_id: null }).eq('id', id)
        if (!error) await charger()
        return { error }
    }

    return { foyer, membres, loading, inviterMembre, modifierMembre, retirerMembre, rafraichir: charger }
}