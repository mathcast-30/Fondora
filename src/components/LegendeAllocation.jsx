const COULEURS_DEFAUT = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

function LegendeAllocation({ data, valueKey = 'montant', nameKey = 'nom', colorKey = 'couleur', total }) {
    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const donneesTriees = [...data].sort((a, b) => b[valueKey] - a[valueKey])

    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {donneesTriees.map((item, index) => {
                const pourcentage = total > 0 ? (item[valueKey] / total) * 100 : 0
                return (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item[colorKey] || COULEURS_DEFAUT[index % COULEURS_DEFAUT.length] }}
                            />
                            <span className="text-navy truncate">{item[nameKey]}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-gray-400 text-xs">{pourcentage.toFixed(1)}%</span>
                            <span className="text-navy font-medium">{formatMontant(item[valueKey])}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default LegendeAllocation