import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

function StepResume({ wizardData, refreshProfile }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const labels = {
        celibataire: 'Célibataire',
        marie: 'Marié / Pacsé',
        precaution: 'Épargne de précaution',
        investissement: 'Investissement',
        fire: 'FIRE',
        transmission: 'Transmission',
    }

    const moduleLabels = {
        immobilier: '🏠 Immobilier',
        bourse: '📈 Bourse / ETF',
        crypto: '₿ Crypto',
        assurance_vie: '🛡️ Assurance-Vie',
    }

    const handleTerminer = async () => {
        setLoading(true)

        await supabase.from('profiles').update({
            situation_familiale: wizardData.situation_familiale,
            objectif_principal: wizardData.objectif_principal,
            modules_actifs: wizardData.modules_actifs || [],
            onboarding_completed: true,
        }).eq('id', user.id)

        await supabase.from('snapshot_patrimoine').upsert({
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            total_cash: wizardData.premier_compte?.solde || 0,
        })

        await refreshProfile()
        navigate('/')
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="p-4 rounded-xl bg-navy-light border border-gray-700">
                    <span className="text-gray-400 text-sm">Situation fiscale</span>
                    <p className="text-white font-semibold mt-1">
                        {labels[wizardData.situation_familiale] || '—'}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-navy-light border border-gray-700">
                    <span className="text-gray-400 text-sm">Objectif principal</span>
                    <p className="text-white font-semibold mt-1">
                        {labels[wizardData.objectif_principal] || '—'}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-navy-light border border-gray-700">
                    <span className="text-gray-400 text-sm">Modules activés</span>
                    <p className="text-white font-semibold mt-1">
                        💰 Comptes & Budget
                        {(wizardData.modules_actifs || []).map((m) => (
                            <span key={m}> · {moduleLabels[m]}</span>
                        ))}
                    </p>
                </div>

                {wizardData.premier_compte && (
                    <div className="p-4 rounded-xl bg-navy-light border border-gray-700">
                        <span className="text-gray-400 text-sm">Premier compte</span>
                        <p className="text-white font-semibold mt-1">
                            {wizardData.premier_compte.nom} —{' '}
                            {wizardData.premier_compte.solde.toLocaleString('fr-FR')} €
                        </p>
                    </div>
                )}
            </div>

            <button
                onClick={handleTerminer}
                disabled={loading}
                className="w-full bg-emerald text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-emerald-light transition"
            >
                {loading ? 'Finalisation…' : '🚀 Accéder à Fondora'}
            </button>
        </div>
    )
}

export default StepResume