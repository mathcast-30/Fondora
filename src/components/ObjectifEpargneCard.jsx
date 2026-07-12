import { useState } from 'react'
import { Target, Pencil } from 'lucide-react'
import SecureValue from './SecureValue'

function ObjectifEpargneCard({ objectif, soldeActuel, onDefinirObjectif }) {
    const [editionOuverte, setEditionOuverte] = useState(false)
    const [montant, setMontant] = useState(objectif?.montant_cible || '')

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const montantCible = Number(objectif?.montant_cible || 0)
    const pourcentage = montantCible > 0 ? Math.min((soldeActuel / montantCible) * 100, 100) : 0
    const atteint = soldeActuel >= montantCible && montantCible > 0

    const handleSubmit = async (e) => {
        e.preventDefault()
        await onDefinirObjectif(parseFloat(montant))
        setEditionOuverte(false)
    }

    if (editionOuverte || !objectif) {
        return (
            <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="text-navy font-semibold mb-3 flex items-center gap-2">
                    <Target size={18} className="text-emerald" />
                    Objectif d'épargne du mois
                </h3>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Montant à épargner (€)"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        required
                    />
                    <button type="submit" className="bg-emerald text-white px-4 rounded-lg text-sm font-medium">
                        Valider
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-navy font-semibold flex items-center gap-2">
                    <Target size={18} className="text-emerald" />
                    Objectif d'épargne du mois
                </h3>
                <button onClick={() => setEditionOuverte(true)} className="text-gray-300 hover:text-navy">
                    <Pencil size={16} />
                </button>
            </div>

            <div className="flex items-end justify-between mb-2">
                <p className="text-navy font-bold text-2xl"><SecureValue value={soldeActuel} formatter={formatMontant} /></p>
                <p className="text-gray-400 text-sm">objectif : <SecureValue value={montantCible} formatter={formatMontant} /></p>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pourcentage}%`, backgroundColor: atteint ? '#10b981' : '#3b82f6' }}
                />
            </div>

            <p className="text-xs text-gray-400">
                {atteint
                    ? '🎉 Objectif atteint ! Continue comme ça.'
                    : `${pourcentage.toFixed(0)}% de l'objectif atteint`}
            </p>
        </div>
    )
}

export default ObjectifEpargneCard