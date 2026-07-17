import { useMemo } from 'react'
import { calculateDiversificationScore, getDiversificationColor, getDiversificationBgColor } from '../lib/diversificationScore'
import { BarChart3 } from 'lucide-react'

/**
 * Component to display diversification score
 * @param {Object} props - Component props
 * @param {Array} props.positions - Array of positions with amount, name, sector, type
 * @param {number} props.total - Total portfolio value
 * @returns {JSX.Element} Diversification score display
 */
function DiversificationScore({ positions, total }) {
    const { score, breakdown, advice, grade } = useMemo(() => {
        return calculateDiversificationScore(positions, total)
    }, [positions, total])

    const colorClass = getDiversificationColor(score)
    const bgColorClass = getDiversificationBgColor(score)

    const formatScore = (value) => {
        return new Intl.NumberFormat('fr-FR').format(value)
    }

    return (
        <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-emerald" />
                <h3 className="text-[var(--text-h)] font-semibold">Score de diversification</h3>
            </div>

            {/* Main Score Display */}
            <div className={`flex items-center justify-between mb-4 p-4 rounded-xl ${bgColorClass}`}>
                <div>
                    <p className="text-[var(--text)] text-sm mb-1">Score global</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`text-4xl font-bold ${colorClass}`}>{formatScore(score)}</p>
                        <span className="text-2xl font-bold text-[var(--text)]">/100</span>
                    </div>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${colorClass} bg-opacity-10`}>
                    {grade}
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald" />
                        <span className="text-sm text-[var(--text)]">Classes d'actifs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-h)]">{formatScore(breakdown.assetClass)}</span>
                        <span className="text-xs text-[var(--text-muted)]">/40</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm text-[var(--text)]">Secteurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-h)]">{formatScore(breakdown.sector)}</span>
                        <span className="text-xs text-[var(--text-muted)]">/30</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-[var(--text)]">Concentration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-h)]">{formatScore(breakdown.concentration)}</span>
                        <span className="text-xs text-[var(--text-muted)]">/30</span>
                    </div>
                </div>
            </div>

            {/* Advice */}
            <div className={`p-3 rounded-lg ${grade === 'A' ? 'bg-emerald/10 text-emerald' : 'bg-surface'}`}>
                <p className="text-xs text-[var(--text)]">{advice}</p>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-2">Interprétation du score</p>
                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-emerald font-bold">A</span>
                        <span className="text-[var(--text)]">Excellent</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-blue-500 font-bold">B</span>
                        <span className="text-[var(--text)]">Bon</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-500 font-bold">C</span>
                        <span className="text-[var(--text)]">Moyen</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-orange-500 font-bold">D</span>
                        <span className="text-[var(--text)]">Faible</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[var(--negative)] font-bold">F</span>
                        <span className="text-[var(--text)]">À améliorer</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DiversificationScore
