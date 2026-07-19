import { Sparkles, TrendingDown, Calendar } from 'lucide-react'
import { useIncognito } from '../../context/IncognitoContext'

const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)

export default function WidgetRestantAVivre({ restantAVivreReel, depensesAvenir, budgetQuotidienConseille, joursRestants }) {
    const { incognito } = useIncognito()
    const mask = (v) => (incognito ? '••••' : fmt(v))

    const isPositif = restantAVivreReel >= 0
    const couleurPrincipale = isPositif ? 'text-emerald-400' : 'text-red-400'
    const bgGradient = isPositif ? 'from-emerald-500/5 to-transparent' : 'from-red-500/5 to-transparent'

    return (
        <div className={`bg-card border border-[var(--border)] rounded-2xl p-5 bg-gradient-to-br ${bgGradient}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text)]">
                        Restant à vivre
                    </span>
                </div>
                <span className="bg-[var(--bg)] text-[var(--text)] text-xs px-2.5 py-1 rounded-full border border-[var(--border)]">
                    <Calendar size={11} className="inline mr-1" />
                    {joursRestants}j restants
                </span>
            </div>

            <p className={`text-3xl font-bold tracking-tight mb-1 ${couleurPrincipale}`}>
                {mask(restantAVivreReel)}
            </p>

            {depensesAvenir > 0 && (
                <p className="text-xs text-[var(--text)] mb-4 flex items-center gap-1.5">
                    <TrendingDown size={12} className="text-red-400 shrink-0" />
                    <span>
                        Dont <span className="text-red-400 font-semibold">{mask(depensesAvenir)}</span> de charges à venir
                    </span>
                </p>
            )}

            <div className="border-t border-[var(--border)] pt-3 mt-3">
                <p className="text-xs text-[var(--text)] mb-0.5">Budget quotidien conseillé</p>
                <p className={`text-lg font-bold ${isPositif ? 'text-emerald-400' : 'text-red-400'}`}>
                    {mask(budgetQuotidienConseille)}
                    <span className="text-xs font-normal text-[var(--text)] ml-1">/ jour</span>
                </p>
            </div>
        </div>
    )
}