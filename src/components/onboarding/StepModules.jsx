import { useState } from 'react'

function StepModules({ onNext }) {
    const [actifs, setActifs] = useState([])

    const modules = [
        { id: 'immobilier', label: 'Immobilier', emoji: '🏠', description: 'Biens, crédits, rendement locatif' },
        { id: 'bourse', label: 'Bourse / ETF', emoji: '📈', description: 'PEA, CTO, actions, ETF' },
        { id: 'crypto', label: 'Crypto', emoji: '₿', description: 'Bitcoin, Ethereum et altcoins' },
        { id: 'assurance_vie', label: 'Assurance-Vie', emoji: '🛡️', description: 'Contrats fonds euros et UC' },
    ]

    const toggle = (id) => {
        setActifs((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        )
    }

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl border-2 border-gray-700 bg-navy-light opacity-60 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                    <div className="text-white font-semibold">Comptes & Budget</div>
                    <div className="text-gray-400 text-sm">Toujours actif</div>
                </div>
                <span className="ml-auto text-emerald text-xl">✓</span>
            </div>

            {modules.map((m) => (
                <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition ${actifs.includes(m.id)
                            ? 'border-emerald bg-emerald/10'
                            : 'border-gray-700 bg-navy-light hover:border-gray-500'
                        }`}
                >
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                        <div className="text-white font-semibold">{m.label}</div>
                        <div className="text-gray-400 text-sm">{m.description}</div>
                    </div>
                    <span className={`ml-auto text-xl ${actifs.includes(m.id) ? 'text-emerald' : 'text-gray-600'}`}>
                        {actifs.includes(m.id) ? '✓' : '+'}
                    </span>
                </button>
            ))}

            <button
                onClick={() => onNext({ modules_actifs: actifs })}
                className="w-full bg-emerald text-white font-semibold py-3 rounded-xl hover:bg-emerald-light transition"
            >
                Continuer →
            </button>
        </div>
    )
}

export default StepModules