function ProjectionCard({ projection }) {
    const { soldeActuel, soldeProjete, jourActuel, joursDansLeMois, estMoisActuel } = projection

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const pourcentageEcoule = (jourActuel / joursDansLeMois) * 100

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-navy font-semibold mb-1">Projection de fin de mois</h3>
            <p className="text-xs text-gray-400 mb-4">
                {estMoisActuel
                    ? `Jour ${jourActuel} sur ${joursDansLeMois} (${pourcentageEcoule.toFixed(0)}% du mois écoulé)`
                    : 'Mois terminé'}
            </p>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-gray-400 text-xs">Solde actuel</p>
                    <p className="text-navy font-bold text-lg">{formatMontant(soldeActuel)}</p>
                </div>
                <div className="text-gray-300 text-xl">→</div>
                <div className="text-right">
                    <p className="text-gray-400 text-xs">Solde projeté en fin de mois</p>
                    <p className={`font-bold text-lg ${soldeProjete >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                        {formatMontant(soldeProjete)}
                    </p>
                </div>
            </div>

            {estMoisActuel && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="h-full bg-emerald rounded-full transition-all"
                        style={{ width: `${Math.min(pourcentageEcoule, 100)}%` }}
                    />
                </div>
            )}

            {soldeProjete < 0 && (
                <p className="text-xs text-red-500 mt-3">
                    ⚠️ À ce rythme, ton solde risque d'être négatif en fin de mois.
                </p>
            )}
        </div>
    )
}

export default ProjectionCard