import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConsentement } from '../hooks/useConsentement'

export default function ReconsentementModal() {
    const { user } = useAuth()
    const { aConsentement, enregistrerConsentement, loading } = useConsentement()
    const [visible, setVisible] = useState(false)
    const [acceptedCheckbox, setAcceptedCheckbox] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!loading && user) {
            const acceptedCGU = aConsentement('cgu', '1.0')
            const acceptedPolitique = aConsentement('politique_confidentialite', '1.0')
            // S'affiche si l'utilisateur n'a pas accepté le CGU OU la politique
            setVisible(!acceptedCGU || !acceptedPolitique)
        } else {
            setVisible(false)
        }
    }, [user, loading, aConsentement])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!acceptedCheckbox || submitting) return
        setSubmitting(true)
        try {
            await Promise.all([
                enregistrerConsentement('cgu', '1.0'),
                enregistrerConsentement('politique_confidentialite', '1.0')
            ])
            setVisible(false)
        } catch (err) {
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    if (!visible) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div 
                style={{ 
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                }} 
                className="w-full max-w-lg p-8 shadow-2xl relative"
            >
                <h2 className="text-xl font-bold text-white mb-4">
                    Mise à jour des documents légaux
                </h2>
                
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Nous avons mis à jour nos documents légaux. Veuillez lire et accepter les nouvelles versions pour continuer.
                </p>

                <div className="flex flex-col gap-3 mb-6 bg-navy-light/40 p-4 rounded-lg border border-navy-light">
                    <a 
                        href="/cgu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald hover:underline text-sm font-medium flex items-center justify-between"
                    >
                        📄 Lire les CGU (v1.0) <span className="text-xs text-gray-500">Ouvre un nouvel onglet ↗</span>
                    </a>
                    <a 
                        href="/politique-confidentialite" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald hover:underline text-sm font-medium flex items-center justify-between"
                    >
                        🔒 Lire la Politique de Confidentialité (v1.0) <span className="text-xs text-gray-500">Ouvre un nouvel onglet ↗</span>
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={acceptedCheckbox}
                            onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                            className="mt-1 accent-emerald w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs text-gray-300 leading-snug">
                            J'ai lu et j'accepte les CGU et la Politique de Confidentialité version 1.0.
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={!acceptedCheckbox || submitting}
                        className={`w-full py-3 rounded-lg text-sm font-semibold transition cursor-pointer text-white ${
                            acceptedCheckbox && !submitting
                                ? 'bg-emerald hover:bg-emerald-light'
                                : 'bg-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        {submitting ? 'Enregistrement...' : 'Continuer'}
                    </button>
                </form>
            </div>
        </div>
    )
}
