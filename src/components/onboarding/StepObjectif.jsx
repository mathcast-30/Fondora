import { useState } from 'react'

function StepObjectif({ onNext }) {
    const [choix, setChoix] = useState('')

    const objectifs = [
        { valeur: 'precaution', emoji: '🛡️', label: 'Épargne de précaution', description: 'Constituer un fonds d\'urgence de 3 à 6 mois de dépenses' },
        { valeur: 'investissement', emoji: '📈', label: 'Investissement', description: 'Faire fructifier mon capital sur le long terme' },
        { valeur: 'fire', emoji: '🔥', label: 'FIRE', description: 'Atteindre l\'indépendance financière et la retraite anticipée' },
        { valeur: 'transmission', emoji: '👨‍👩‍👧', label: 'Transmission', description: 'Préparer mon patrimoine pour mes proches' },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {objectifs.map((o) => (
                    <button
                        key={o.valeur}
                        onClick={() => setChoix(o.valeur)}
                        className={`p-5 rounded-xl border-2 text-left transition ${choix === o.valeur
                                ? 'border-emerald bg-emerald/10'
                                : 'border-gray-700 bg-navy-light hover:border-gray-500'
                            }`}
                    >
                        <div className="text-3xl mb-2">{o.emoji}</div>
                        <div className="text-white font-semibold">{o.label}</div>
                        <div className="text-gray-400 text-sm mt-1">{o.description}</div>
                    </button>
                ))}
            </div>

            <button
                onClick={() => onNext({ objectif_principal: choix })}
                disabled={!choix}
                className="w-full bg-emerald text-white font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-light transition"
            >
                Continuer →
            </button>
        </div>
    )
}

export default StepObjectif