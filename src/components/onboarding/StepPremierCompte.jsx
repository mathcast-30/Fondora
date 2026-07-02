import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

function StepPremierCompte({ onNext }) {
    const { user } = useAuth()
    const [nom, setNom] = useState('')
    const [type, setType] = useState('courant')
    const [solde, setSolde] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const types = [
        { value: 'courant', label: 'Compte courant' },
        { value: 'epargne', label: 'Épargne (Livret A…)' },
        { value: 'pea', label: 'PEA' },
        { value: 'cto', label: 'CTO' },
        { value: 'crypto', label: 'Wallet Crypto' },
    ]

    const handleSubmit = async () => {
        if (!nom || !solde) return setError('Remplis tous les champs')
        setLoading(true)
        const { error: err } = await supabase.from('comptes').insert({
            user_id: user.id,
            nom,
            type,
            solde: parseFloat(solde),
        })
        if (err) {
            setError(err.message)
            setLoading(false)
            return
        }
        onNext({ premier_compte: { nom, type, solde: parseFloat(solde) } })
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="text-gray-400 text-sm block mb-1">Nom du compte</label>
                <input
                    type="text"
                    placeholder="Ex: Compte BNP"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-navy-light border border-gray-700 text-white focus:outline-none focus:border-emerald"
                />
            </div>

            <div>
                <label className="text-gray-400 text-sm block mb-1">Type de compte</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-navy-light border border-gray-700 text-white focus:outline-none focus:border-emerald"
                >
                    {types.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-gray-400 text-sm block mb-1">Solde actuel (€)</label>
                <input
                    type="number"
                    placeholder="Ex: 3500"
                    value={solde}
                    onChange={(e) => setSolde(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-navy-light border border-gray-700 text-white focus:outline-none focus:border-emerald"
                />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-emerald text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-emerald-light transition"
            >
                {loading ? 'Enregistrement…' : 'Continuer →'}
            </button>
        </div>
    )
}

export default StepPremierCompte