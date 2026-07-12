import SecureValue from './SecureValue'

function BudgetBar({ nom, couleur, depense, budgetMax }) {
    const pourcentage = budgetMax > 0 ? Math.min((depense / budgetMax) * 100, 100) : 0
    const depasse = budgetMax > 0 && depense > budgetMax

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: couleur }} />
                    <span className="text-sm font-medium text-navy">{nom}</span>
                </div>
                <span className={`text-sm font-semibold ${depasse ? 'text-red-500' : 'text-gray-500'}`}>
                    <SecureValue value={depense} formatter={formatMontant} /> {budgetMax > 0 && <span>/ <SecureValue value={budgetMax} formatter={formatMontant} /></span>}
                </span>
            </div>
            {budgetMax > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${pourcentage}%`,
                            backgroundColor: depasse ? '#ef4444' : couleur,
                        }}
                    />
                </div>
            )}
            {depasse && (
                <p className="text-xs text-red-500 mt-1">
                    ⚠️ Budget dépassé de <SecureValue value={depense - budgetMax} formatter={formatMontant} />
                </p>
            )}
        </div>
    )
}

export default BudgetBar