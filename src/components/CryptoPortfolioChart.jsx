import { useMemo, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import SecureValue from './SecureValue'
import { useIncognito } from '../context/IncognitoContext'

/**
 * Chart component for displaying crypto portfolio historical valuation
 * @param {Object} props - Component props
 * @param {Array} props.data - Historical data points
 * @param {string} props.periode - Current time period filter
 * @param {Function} props.setPeriode - Callback to change time period
 * @returns {JSX.Element} Crypto portfolio chart
 */
function CryptoPortfolioChart({ data, periode, setPeriode }) {
    const { incognito } = useIncognito()
    const PERIODES = [
        { label: '7 jours', valeur: '7j' },
        { label: '30 jours', valeur: '30j' },
        { label: '1 an', valeur: '1an' },
        { label: 'Tout', valeur: 'tout' },
    ]

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR', 
            maximumFractionDigits: 0 
        }).format(m)

    const formatDate = useCallback((d) => {
        if (!d) return ''
        const date = new Date(d)
        
        // Format based on period
        if (periode === '7j' || periode === '30j') {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        } else if (periode === '1an') {
            return date.toLocaleDateString('fr-FR', { month: 'short' })
        } else {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
        }
    }, [periode])

    // Prepare chart data
    const chartData = useMemo(() => {
        return data.map(h => ({
            date: formatDate(h.date),
            valeur: Number(h.valeur)
        }))
    }, [data, formatDate])

    const premiereDateValeur = chartData[0]?.valeur || 0
    const derniereValeur = chartData[chartData.length - 1]?.valeur || 0
    const variation = derniereValeur - premiereDateValeur
    const variationPourcent = premiereDateValeur > 0 ? (variation / premiereDateValeur) * 100 : 0

    return (
        <div className="bg-navy rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-gray-300 text-sm mb-1">Valorisation du portefeuille crypto</p>
                    <div className="flex items-baseline gap-3">
                        <p className="text-white text-3xl font-bold"><SecureValue value={derniereValeur} formatter={formatMontant} /></p>
                        {chartData.length > 1 && (
                            <p className={`text-sm font-medium ${variation >= 0 ? 'text-emerald' : 'text-red-400'}`}>
                                {variation >= 0 ? '+' : ''}<SecureValue value={variation} formatter={formatMontant} /> 
                                <SecureValue value={variationPourcent} formatter={v => ` (${v >= 0 ? '+' : ''}${v.toFixed(2)}%)`} />
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 bg-navy-light p-1 rounded-lg">
                    {PERIODES.map((p) => (
                        <button
                            key={p.valeur}
                            onClick={() => setPeriode(p.valeur)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                periode === p.valeur 
                                    ? 'bg-emerald text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {chartData.length === 0 ? (
                <p className="text-gray-400 text-center py-16">
                    Pas encore d'historique. Les données apparaîtront après tes premières transactions.
                </p>
            ) : chartData.length === 1 ? (
                <p className="text-gray-400 text-center py-16">
                    Premier point de données enregistré. La courbe apparaîtra avec plus de données.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="couleurValeurCrypto" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#94a3b8', fontSize: 11 }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            tick={{ fill: '#94a3b8', fontSize: 11 }} 
                            tickFormatter={(v) => incognito ? '••••' : formatMontant(v)} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip
                            formatter={(value) => incognito ? '••••' : formatMontant(value)}
                            contentStyle={{
                                backgroundColor: '#122a44', 
                                border: 'none', 
                                borderRadius: '8px', 
                                color: '#fff'
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="valeur" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            fill="url(#couleurValeurCrypto)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

export default CryptoPortfolioChart
