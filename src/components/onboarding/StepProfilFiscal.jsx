import { useState } from 'react'

function StepProfilFiscal({ onNext }) {
    const [choix, setChoix] = useState('')

    const options = [
        {
            valeur: 'celibataire',
            label: 'Célibataire',
            emoji: '🧑',
            description: 'Abattement AV : 4 600€/an',
        },
        {
            valeur: 'marie',
            label: 'Marié / Pacsé',
            emoji: '👫',
            description: 'Abattement AV : 9 200€/an',
        },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {options.map((o) => (
                    <button
                        key={o.valeur}
                        onClick={() => setChoix(o.valeur)}
                        className={`p-6 rounded-xl border-2 text-left transition ${choix === o.valeur
                                ? 'border-emerald bg-emerald/10'
                                : 'border-gray-700 bg-navy-light hover:border-gray-500'
                            }`}
                    >
                        <div className="text-4xl mb-3">{o.emoji}</div>
                        <div className="text-white font-semibold text-lg">{o.label}</div>
                        <div className="text-gray-400 text-sm mt-1">{o.description}</div>
                    </button>
                ))}
            </div>

            <button
                onClick={() => onNext({ situation_familiale: choix })}
                disabled={!choix}
                className="w-full bg-emerald text-white font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-light transition"
            >
                Continuer →
            </button>
        </div>
    )
}

export default StepProfilFiscal