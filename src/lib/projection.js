// Calcule une projection de fin de mois basée sur le rythme de dépense actuel
export function calculerProjection(transactions, mois, annee) {
    const aujourdHui = new Date()
    const estMoisActuel = aujourdHui.getMonth() + 1 === mois && aujourdHui.getFullYear() === annee

    const joursDansLeMois = new Date(annee, mois, 0).getDate()
    const jourActuel = estMoisActuel ? aujourdHui.getDate() : joursDansLeMois

    const revenus = transactions.filter((t) => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
    const depenses = transactions.filter((t) => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)

    const soldeActuel = revenus - depenses

    if (!estMoisActuel || jourActuel === 0) {
        return {
            soldeActuel,
            soldeProjete: soldeActuel,
            depensesProjetees: depenses,
            jourActuel,
            joursDansLeMois,
            estMoisActuel,
        }
    }

    // Rythme moyen de dépense par jour écoulé, extrapolé sur tout le mois
    const depensesParJour = depenses / jourActuel
    const depensesProjetees = depensesParJour * joursDansLeMois

    // On suppose les revenus déjà tous perçus ce mois-ci (souvent le cas avec salaire fixe en début de mois)
    const soldeProjete = revenus - depensesProjetees

    return {
        soldeActuel,
        soldeProjete,
        depensesProjetees,
        jourActuel,
        joursDansLeMois,
        estMoisActuel,
    }
}