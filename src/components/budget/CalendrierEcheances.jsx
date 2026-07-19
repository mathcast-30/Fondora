import { CalendarDays } from 'lucide-react'

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * Mini-calendrier mensuel affichant les jours de prélèvement des abonnements.
 * @param {Array} abonnements - [{nom_abonnement, montant, jour_prelevement, resiliation_planifiee}]
 * @param {number} mois       - 1..12
 * @param {number} annee
 */
export default function CalendrierEcheances({ abonnements = [], mois, annee }) {
    const today = new Date()
    const isCurrentMonth = today.getMonth() + 1 === mois && today.getFullYear() === annee
    const jourAujourdhui = isCurrentMonth ? today.getDate() : null

    const premierJour = new Date(annee, mois - 1, 1).getDay()
    const offsetLundi = (premierJour + 6) % 7

    const nbJours = new Date(annee, mois, 0).getDate()

    const echeancesParJour = {}
    abonnements.forEach(ab => {
        const j = Number(ab.jour_prelevement)
        if (j >= 1 && j <= nbJours) {
            if (!echeancesParJour[j]) echeancesParJour[j] = []
            echeancesParJour[j].push(ab)
        }
    })

    const cases = Array(offsetLundi).fill(null).concat(
        Array.from({ length: nbJours }, (_, i) => i + 1)
    )
    while (cases.length % 7 !== 0) cases.push(null)

    return (
        <div className="bg-card border border-[var(--border)] rounded-2xl p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={15} className="text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text)]">
                    Échéances du mois
                </span>
                {abonnements.length > 0 && (
                    <span className="ml-auto text-xs bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded-full text-[var(--text)]">
                        {abonnements.length} prélèvement{abonnements.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-7 mb-1">
                {JOURS.map((j, i) => (
                    <div key={i} className="text-center text-[10px] text-[var(--text)] font-medium py-1">{j}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {cases.map((jour, i) => {
                    if (!jour) return <div key={i} />

                    const echeances = echeancesParJour[jour] || []
                    const estAujourdhui = jour === jourAujourdhui
                    const estPasse = jourAujourdhui && jour < jourAujourdhui

                    return (
                        <div
                            key={i}
                            className={`relative flex flex-col items-center py-1 rounded-lg text-xs transition-all
                                ${estAujourdhui ? 'bg-emerald-500/20 ring-1 ring-emerald-400/50' : ''}
                                ${echeances.length > 0 ? 'cursor-pointer hover:bg-[var(--bg)]' : ''}
                            `}
                            title={echeances.map(e => `${e.nom_abonnement} (${e.montant} €)`).join('\n')}
                        >
                            <span className={`font-medium leading-none
                                ${estAujourdhui ? 'text-emerald-400' : ''}
                                ${estPasse && !estAujourdhui ? 'text-[var(--text-muted)]' : 'text-[var(--text-h)]'}
                            `}>
                                {jour}
                            </span>

                            {echeances.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                    {echeances.slice(0, 3).map((e, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full ${e.resiliation_planifiee ? 'bg-red-400' : 'bg-amber-400'}`}
                                        />
                                    ))}
                                    {echeances.length > 3 && (
                                        <span className="text-[8px] text-[var(--text)]">+{echeances.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text)]">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    Prélèvement actif
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text)]">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    Résiliation prévue
                </div>
            </div>
        </div>
    )
}