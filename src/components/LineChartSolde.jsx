import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useIncognito } from '../context/IncognitoContext'

function LineChartSolde({ data }) {
    const { incognito } = useIncognito()
    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)

    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => incognito ? '••••' : formatMontant(v)} />
                <Tooltip formatter={(value) => incognito ? ['••••'] : [formatMontant(value)]} />
                <Line
                    type="monotone"
                    dataKey="solde"
                    name="Solde du mois"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

export default LineChartSolde