import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useHistoriqueSoldeCompte } from '../hooks/useHistoriqueSoldeCompte'

export default function SparklineCompte({ compte }) {
    const { points, tendance, loading } = useHistoriqueSoldeCompte(compte)

    if (loading || points.length < 2) return null

    const couleur = tendance === 'baisse' ? '#ef4444' : '#10b981'

    return (
        <div className="w-16 h-6 shrink-0" title="Évolution du solde">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points}>
                    <Line type="monotone" dataKey="solde" stroke={couleur} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}