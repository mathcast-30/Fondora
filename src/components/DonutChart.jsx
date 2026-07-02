import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COULEURS_DEFAUT = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

function DonutChart({ data, total, valueKey = 'montant', nameKey = 'nom', colorKey = 'couleur', libelleCentre = 'Total' }) {
    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    if (!data || data.length === 0) {
        return <p className="text-gray-400 text-center py-10">Aucune donnée pour l'instant.</p>
    }

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={valueKey}
                        nameKey={nameKey}
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry[colorKey] || COULEURS_DEFAUT[index % COULEURS_DEFAUT.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMontant(value)} />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-xs">{libelleCentre}</p>
                <p className="text-navy font-bold text-lg">{formatMontant(total)}</p>
            </div>
        </div>
    )
}

export default DonutChart