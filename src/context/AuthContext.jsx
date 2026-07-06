import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isIncognito, setIsIncognito] = useState(false)

    const toggleIncognito = () => setIsIncognito((prev) => !prev)

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
    }

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id)
    }

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) await fetchProfile(u.id)
            setLoading(false)
        })

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null
            setUser(u)
            if (u) await fetchProfile(u.id)
            else setProfile(null)
        })

        return () => listener.subscription.unsubscribe()
    }, [])

    const value = {
        user,
        profile,
        refreshProfile,
        isIncognito,
        toggleIncognito,
        signUp: (email, password) => supabase.auth.signUp({ email, password }),
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
        signOut: () => supabase.auth.signOut(),
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}