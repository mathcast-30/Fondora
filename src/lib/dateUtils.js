const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// Regroupe une liste de transactions par mois, calcule revenus/dépenses/solde pour chaque mois
export function regrouperParMois(transactions, nombreMois = 6) {
    const aujourdHui = new Date()
    const resultats = []

    for (let i = nombreMois - 1; i >= 0; i--) {
        const date = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1)
        const mois = date.getMonth()
        const annee = date.getFullYear()

        const transactionsDuMois = transactions.filter((t) => {
            const d = new Date(t.date)
            return d.getMonth() === mois && d.getFullYear() === annee
        })

        const revenus = transactionsDuMois
            .filter((t) => t.type === 'revenu')
            .reduce((s, t) => s + Number(t.montant), 0)

        const depenses = transactionsDuMois
            .filter((t) => t.type === 'depense')
            .reduce((s, t) => s + Number(t.montant), 0)

        resultats.push({
            label: `${MOIS_COURTS[mois]} ${String(annee).slice(2)}`,
            mois,
            annee,
            revenus,
            depenses,
            solde: revenus - depenses,
            tauxEpargne: revenus > 0 ? ((revenus - depenses) / revenus) * 100 : 0,
        })
    }

    return resultats
}