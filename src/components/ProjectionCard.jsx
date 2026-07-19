import SecureValue from './SecureValue'

function ProjectionCard({ projection }) {
    const { soldeActuel, soldeProjete, jourActuel, joursDansLeMois, estMoisActuel } = projection

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const pourcentageEcoule = (jourActuel / joursDansLeMois) * 100

    return (
        <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
            <h3 className="text-[var(--text-h)] font-semibold mb-1">Projection de fin de mois</h3>
            <p className="text-xs text-[var(--text)] mb-4">
                {estMoisActuel
                    ? `Jour ${jourActuel} sur ${joursDansLeMois} (${pourcentageEcoule.toFixed(0)}% du mois écoulé)`
                    : 'Mois terminé'}
            </p>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-[var(--text)] text-xs">Solde actuel</p>
                    <p className="text-[var(--text-h)] font-bold text-lg"><SecureValue value={soldeActuel} formatter={formatMontant} /></p>
                </div>
                <div className="text-[var(--text-muted)] text-xl">→</div>
                <div className="text-right">
                    <p className="text-[var(--text)] text-xs">Solde projeté en fin de mois</p>
                    <p className={`font-bold text-lg ${soldeProjete >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                        <SecureValue value={soldeProjete} formatter={formatMontant} />
                    </p>
                </div>
            </div>

            {estMoisActuel && (
                <div className="w-full bg-surface rounded-full h-2 border border-[var(--border)]">
                    <div
                        className="h-full bg-emerald rounded-full transition-all"
                        style={{ width: `${Math.min(pourcentageEcoule, 100)}%` }}
                    />
                </div>
            )}

            {soldeProjete < 0 && (
                <p className="text-xs text-[var(--negative)] mt-3">
                    ⚠️ À ce rythme, ton solde risque d'être négatif en fin de mois.
                </p>
            )}
        </div>
    )
}

export default ProjectionCard