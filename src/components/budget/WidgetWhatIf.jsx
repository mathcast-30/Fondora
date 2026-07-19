import { useState, useEffect } from 'react'
import { calculerImpactWhatIf } from '../../utils/budgetCalculator'
import { TrendingUp } from 'lucide-react'
import { useIncognito } from '../../context/IncognitoContext'

const fmtK = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${Math.round(v / 1_000)}k`
    return `${v}`
}

export default function WidgetWhatIf({ objectifMensuel = 0, restantAVivre = null }) {
    const { incognito } = useIncognito()
    const [economie, setEconomie] = useState(objectifMensuel || 0)
    const [taux, setTaux] = useState(7)
    const [impacts, setImpacts] = useState({})

    useEffect(() => {
        setImpacts(calculerImpactWhatIf(economie, taux / 100))
    }, [economie, taux])

    useEffect(() => {
        if (objectifMensuel > 0) setEconomie(objectifMensuel)
    }, [objectifMensuel])

    const mask = (v) => (incognito ? '•••• €' : `+${fmtK(v)} €`)
    const objectifDefini = objectifMensuel > 0

    return (
        <div className="bg-card border border-[var(--border)] rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text)]">
                    Et si j'épargnais…
                </span>
            </div>

            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text)]">Économie mensuelle</span>
                    <span className="font-bold text-emerald-400">{economie} €/mois</span>
                </div>
                {objectifMensuel > 0 && <p className="text-[10px] text-[var(--text-muted)] mb-2">Objectif du mois : {objectifMensuel} €</p>}
                <input
                    type="range" min="10" max="1000" step="10"
                    value={economie}
                    onChange={(e) => setEconomie(Number(e.target.value))}
                    disabled={!objectifDefini}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
            </div>

            {!objectifDefini && (
                <p className="text-xs text-amber-400 mb-3">Définis d’abord ton objectif d’épargne mensuel dans Synthèse.</p>
            )}

            {restantAVivre !== null && (
                <p className={`text-[10px] mb-3 ${restantAVivre - economie >= 0 ? 'text-[var(--text-muted)]' : 'text-red-400'}`}>
                    Après cette épargne : {Math.max(0, restantAVivre - economie).toFixed(0)} € disponibles ce mois.
                </p>
            )}

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text)]">Rendement annuel</span>
                    <span className="font-bold text-[var(--text-h)]">{taux}%</span>
                </div>
                <input
                    type="range" min="1" max="12" step="0.5"
                    value={taux}
                    onChange={(e) => setTaux(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-slate-400"
                />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="bg-[var(--bg)] rounded-xl p-3 text-center border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text)] uppercase mb-1">10 ans</p>
                    <p className="text-base font-bold text-[var(--text-h)]">{mask(impacts.ans_10 || 0)}</p>
                </div>
                <div className="bg-[var(--bg)] rounded-xl p-3 text-center border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text)] uppercase mb-1">20 ans</p>
                    <p className="text-base font-bold text-emerald-400">{mask(impacts.ans_20 || 0)}</p>
                </div>
                <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold mb-1">30 ans</p>
                    <p className="text-xl font-black text-emerald-400">{mask(impacts.ans_30 || 0)}</p>
                </div>
            </div>
        </div>
    )
}
