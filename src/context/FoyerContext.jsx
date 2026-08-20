import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FoyerContext = createContext()

export function FoyerProvider({ children }) {
    const { user } = useAuth()
    const [espaces, setEspaces] = useState([])
    const [espaceActifId, setEspaceActifIdState] = useState(() => {
        try { return localStorage.getItem('fondora_espace_actif') || null } catch { return null }
    })
    const [loading, setLoading] = useState(true)

    const charger = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const liste = [{ ownerUserId: user.id, label: 'Mon espace', niveauAcces: 'total', entiteGereeId: null, estMoi: true }]
        const { data: membres } = await supabase
            .from('foyer_membres').select('*, foyers(nom, createur_user_id)')
            .eq('user_id', user.id).eq('statut', 'actif')
        for (const m of membres || []) {
            liste.push({
                ownerUserId: m.foyers.createur_user_id, label: m.foyers.nom,
                niveauAcces: m.niveau_acces, entiteGereeId: m.entite_geree_id, estMoi: false,
            })
        }
        setEspaces(liste)
        setLoading(false)
    }, [user])

    useEffect(() => { charger() }, [charger])

    const setEspaceActifId = (ownerUserId) => {
        setEspaceActifIdState(ownerUserId)
        if (ownerUserId) localStorage.setItem('fondora_espace_actif', ownerUserId)
        else localStorage.removeItem('fondora_espace_actif')
    }

    const espaceActif = espaces.find(e => e.ownerUserId === espaceActifId) || espaces[0] || null
    const ownerUserIdActif = espaceActif?.ownerUserId || user?.id

    const value = useMemo(() => ({ espaces, espaceActif, ownerUserIdActif, setEspaceActifId, loading, rafraichir: charger }),
        [espaces, espaceActif, ownerUserIdActif, loading, charger])

    return <FoyerContext.Provider value={value}>{children}</FoyerContext.Provider>
}

export function useFoyerActif() {
    const ctx = useContext(FoyerContext)
    if (!ctx) throw new Error('useFoyerActif must be used within FoyerProvider')
    return ctx
}