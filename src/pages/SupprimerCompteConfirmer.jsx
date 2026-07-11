import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SupprimerCompteConfirmer() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState('loading') // loading, success, error, expired
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            setStatus('error')
            setErrorMsg('Lien invalide.')
            return
        }
        confirmerSuppression(token)
    }, [])

    async function confirmerSuppression(token) {
        try {
            const { data, error } = await supabase.functions.invoke('confirm-account-deletion', {
                body: { token }
            })

            if (error || data?.error) {
                const msg = data?.error || error.message
                if (msg.includes('expiré')) {
                    setStatus('expired')
                } else {
                    setStatus('error')
                    setErrorMsg(msg)
                }
                return
            }

            // Déconnexion
            await supabase.auth.signOut()
            setStatus('success')

            // Redirection après 5 secondes
            setTimeout(() => navigate('/'), 5000)

        } catch (err) {
            setStatus('error')
            setErrorMsg(err.message)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg, #0f1117)',
            padding: '24px'
        }}>
            <div style={{
                background: 'var(--card-bg, #1a1f2e)',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '480px',
                width: '100%',
                textAlign: 'center',
                fontFamily: 'var(--sans, Arial, sans-serif)'
            }}>

                {/* Chargement */}
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '48px', height: '48px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTop: '3px solid #2563eb',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 24px'
                        }} />
                        <h1 style={{ color: 'var(--text-h, #fff)', fontSize: '1.25rem', margin: '0 0 8px' }}>
                            Suppression en cours…
                        </h1>
                        <p style={{ color: 'var(--text, #9ca3af)', margin: 0, fontSize: '0.875rem' }}>
                            Suppression de toutes vos données en cours. Merci de patienter.
                        </p>
                    </>
                )}

                {/* Succès */}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h1 style={{ color: 'var(--text-h, #fff)', fontSize: '1.5rem', margin: '0 0 12px' }}>
                            Compte supprimé
                        </h1>
                        <p style={{ color: 'var(--text, #9ca3af)', margin: '0 0 24px', fontSize: '0.875rem', lineHeight: 1.6 }}>
                            Toutes vos données ont été définitivement supprimées conformément au RGPD (Art. 17).
                            Un email de confirmation vous a été envoyé.
                        </p>
                        <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '24px'
                        }}>
                            <p style={{ color: '#34d399', margin: 0, fontSize: '0.8125rem' }}>
                                Vous serez redirigé dans 5 secondes…
                            </p>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.8125rem', margin: 0 }}>
                            Vous pouvez créer un nouveau compte à tout moment.
                        </p>
                    </>
                )}

                {/* Expiré */}
                {status === 'expired' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
                        <h1 style={{ color: 'var(--text-h, #fff)', fontSize: '1.5rem', margin: '0 0 12px' }}>
                            Lien expiré
                        </h1>
                        <p style={{ color: 'var(--text, #9ca3af)', margin: '0 0 24px', fontSize: '0.875rem' }}>
                            Ce lien de confirmation a expiré (valable 24h). Retourne dans les paramètres pour faire une nouvelle demande.
                        </p>
                        <button
                            onClick={() => navigate('/parametres')}
                            style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Retour aux paramètres
                        </button>
                    </>
                )}

                {/* Erreur */}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                        <h1 style={{ color: 'var(--text-h, #fff)', fontSize: '1.5rem', margin: '0 0 12px' }}>
                            Une erreur est survenue
                        </h1>
                        <p style={{ color: 'var(--text, #9ca3af)', margin: '0 0 8px', fontSize: '0.875rem' }}>
                            {errorMsg || 'Impossible de traiter votre demande.'}
                        </p>
                        <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '0.8125rem' }}>
                            Réessaie ou contacte le support.
                        </p>
                        <button
                            onClick={() => navigate('/parametres')}
                            style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Retour aux paramètres
                        </button>
                    </>
                )}

            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}