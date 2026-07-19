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
            <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                <h3 className="text-[var(--text-h)] font-semibold mb-3 flex items-center gap-2">
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
                        className="flex-1 border border-[var(--border)] bg-surface rounded-lg px-3 py-2 text-sm text-[var(--text-h)] placeholder-[var(--text-muted)]"
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
        <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[var(--text-h)] font-semibold flex items-center gap-2">
                    <Target size={18} className="text-emerald" />
                    Objectif d'épargne du mois
                </h3>
                <button onClick={() => setEditionOuverte(true)} className="text-[var(--text-muted)] hover:text-[var(--text-h)]">
                    <Pencil size={16} />
                </button>
            </div>

            <div className="flex items-end justify-between mb-2">
                <p className="text-[var(--text-h)] font-bold text-2xl"><SecureValue value={soldeActuel} formatter={formatMontant} /></p>
                <p className="text-[var(--text)] text-sm">objectif : <SecureValue value={montantCible} formatter={formatMontant} /></p>
            </div>

            <div className="w-full bg-surface rounded-full h-3 overflow-hidden mb-2 border border-[var(--border)]">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pourcentage}%`, backgroundColor: atteint ? '#10b981' : '#3b82f6' }}
                />
            </div>

            <p className="text-xs text-[var(--text)]">
                {atteint
                    ? '🎉 Objectif atteint ! Continue comme ça.'
                    : `${pourcentage.toFixed(0)}% de l'objectif atteint`}
            </p>
        </div>
    )
}

export default ObjectifEpargneCard