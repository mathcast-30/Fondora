import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConsentement } from '../hooks/useConsentement'

export default function CookieBanner() {
    const { user } = useAuth()
    const { aConsentement, enregistrerConsentement, loading } = useConsentement()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!loading && user) {
            const accepted = aConsentement('cookies', '1.0')
            setVisible(!accepted)
        } else {
            setVisible(false)
        }
    }, [user, loading, aConsentement])

    const handleAccept = async () => {
        await enregistrerConsentement('cookies', '1.0')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div 
            style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderTop: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
            }} 
            className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl"
        >
            <div className="text-sm text-gray-200">
                🍪 Fondora utilise uniquement des cookies techniques indispensables à votre connexion. Aucun cookie publicitaire ou de tracking.{' '}
                <Link to="/politique-confidentialite" className="text-emerald hover:underline font-medium">
                    En savoir plus
                </Link>
            </div>
            <button
                onClick={handleAccept}
                className="bg-emerald hover:bg-emerald-light text-white px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap"
            >
                J'accepte
            </button>
        </div>
    )
}
