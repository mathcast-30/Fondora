import { THEME } from '../lib/theme'
import SecureValue from './SecureValue'
import { Trash2 } from 'lucide-react'

function BudgetBar({ nom, couleur, depense, budgetMax, id, onDelete, herite = false }) {
    const pourcentage = budgetMax > 0 ? Math.min((depense / budgetMax) * 100, 100) : 0
    const depasse = budgetMax > 0 && depense > budgetMax

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: couleur }} />
                    <span className="text-sm font-medium text-[var(--text-h)]">{nom}</span>
                    {herite && <span className="text-xs text-[var(--text-muted)]">(hérité)</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${depasse ? 'text-[var(--negative)]' : 'text-[var(--text)]'}`}>
                        <SecureValue value={depense} formatter={formatMontant} /> {budgetMax > 0 && <span>/ <SecureValue value={budgetMax} formatter={formatMontant} /></span>}
                    </span>
                    {onDelete && id && !herite && (
                        <button
                            onClick={() => onDelete(id)}
                            aria-label="Supprimer le budget"
                            className="text-[var(--text-muted)] hover:text-[var(--negative)] transition p-1"
                            title="Supprimer ce budget"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {budgetMax > 0 && (
                <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-[var(--border)]">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${pourcentage}%`,
                            backgroundColor: depasse ? THEME.negative : couleur,
                        }}
                    />
                </div>
            )}
            {depasse && (
                <p className="text-xs text-[var(--negative)] mt-1">
                    Budget dépassé de <SecureValue value={depense - budgetMax} formatter={formatMontant} />
                </p>
            )}
        </div>
    )
}

export default BudgetBar
