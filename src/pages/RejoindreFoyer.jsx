import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function RejoindreFoyer() {
    const { token } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [statut, setStatut] = useState('loading')
    const [erreur, setErreur] = useState('')
    const [foyerNom, setFoyerNom] = useState('')

    useEffect(() => {
        if (!user) { setStatut('besoin_connexion'); return }
        (async () => {
            const { data, error } = await supabase.functions.invoke('accepter-invitation-foyer', { body: { token } })
            if (error || data?.error) { setErreur(data?.error || error.message); setStatut('erreur'); return }
            setFoyerNom(data.foyer_nom); setStatut('ok')
        })()
    }, [user, token])

    const box = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1f33', color: '#fff', padding: 24, textAlign: 'center' }

    if (statut === 'loading') return <div style={box}>Vérification de l'invitation…</div>
    if (statut === 'besoin_connexion') return (
        <div style={box}><div>
            <p style={{ marginBottom: 16 }}>Connecte-toi ou crée un compte pour rejoindre ce foyer.</p>
            <button onClick={() => navigate(`/login?redirect=/foyer/rejoindre/${token}`)} style={{ background: '#10b981', padding: '10px 24px', borderRadius: 8, color: '#0a1f33', fontWeight: 700, border: 'none', marginRight: 8 }}>Se connecter</button>
            <button onClick={() => navigate(`/signup?redirect=/foyer/rejoindre/${token}`)} style={{ background: 'transparent', border: '1px solid #fff', padding: '10px 24px', borderRadius: 8, color: '#fff' }}>Créer un compte</button>
        </div></div>
    )
    if (statut === 'erreur') return <div style={box}><p style={{ color: '#f87171' }}>{erreur}</p></div>
    return (
        <div style={box}><div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ marginBottom: 16 }}>Tu as rejoint le foyer <strong>{foyerNom}</strong> !</p>
            <button onClick={() => navigate('/synthese')} style={{ background: '#10b981', padding: '10px 24px', borderRadius: 8, color: '#0a1f33', fontWeight: 700, border: 'none' }}>Accéder à Fondora</button>
        </div></div>
    )
}