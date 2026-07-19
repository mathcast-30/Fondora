import ExcelJS from 'exceljs';

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function genererBilanBudget({
    transactions = [],
    budgets = [],
    categories = [],
    mois,
    annee,
    totalRevenus = 0,
    totalDepenses = 0,
    solde = 0,
}) {
    const workbook = XLSX.utils.book_new()
    const periodeLabel = `${MOIS_NOMS[mois - 1]} ${annee}`

    // ─── Feuille 1 : Transactions ───
    const feuilleTransactions = transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString('fr-FR'),
        Description: t.description || t.categories?.nom || '',
        Catégorie: t.categories?.nom || 'Non catégorisé',
        Compte: t.comptes?.nom || '',
        Type: t.type === 'revenu' ? 'Revenu' : 'Dépense',
        'Montant (€)': t.type === 'revenu' ? Number(t.montant) : -Number(t.montant),
        Récurrente: t.recurrente ? 'Oui' : 'Non',
    }))
    const wsTransactions = XLSX.utils.json_to_sheet(feuilleTransactions)
    wsTransactions['!cols'] = [
        { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(workbook, wsTransactions, 'Transactions')

    // ─── Feuille 2 : Rapport Budget ───
    const categoriesDepense = categories.filter(c => c.type === 'depense')
    const feuilleBudget = categoriesDepense.map((c) => {
        const budget = budgets.find(b => b.categorie_id === c.id)
        const montantAlloue = budget ? Number(budget.montant_max) : 0
        const depense = transactions
            .filter(t => t.categorie_id === c.id && t.type === 'depense')
            .reduce((s, t) => s + Number(t.montant), 0)
        const pctUtilise = montantAlloue > 0 ? Math.round((depense / montantAlloue) * 1000) / 10 : null

        return {
            Catégorie: c.nom,
            'Budget alloué (€)': montantAlloue || '—',
            'Dépensé (€)': depense,
            'Restant (€)': montantAlloue ? Math.round((montantAlloue - depense) * 100) / 100 : '—',
            '% utilisé': pctUtilise !== null ? `${pctUtilise}%` : '—',
            Statut: montantAlloue === 0 ? 'Sans budget' : depense > montantAlloue ? 'Dépassé' : 'Dans les clous',
        }
    }).filter(row => row['Dépensé (€)'] > 0 || row['Budget alloué (€)'] !== '—')

    const wsBudget = XLSX.utils.json_to_sheet(feuilleBudget)
    wsBudget['!cols'] = [
        { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 15 },
    ]
    XLSX.utils.book_append_sheet(workbook, wsBudget, 'Rapport Budget')

    // ─── Feuille 3 : Snapshot du mois ───
    const nbTransactions = transactions.length
    const depensesParCategorie = categoriesDepense
        .map(c => ({
            nom: c.nom,
            montant: transactions.filter(t => t.categorie_id === c.id && t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0),
        }))
        .filter(c => c.montant > 0)
        .sort((a, b) => b.montant - a.montant)

    const feuilleSnapshot = [
        { Indicateur: 'Période', Valeur: periodeLabel },
        { Indicateur: 'Revenus totaux (€)', Valeur: totalRevenus },
        { Indicateur: 'Dépenses totales (€)', Valeur: totalDepenses },
        { Indicateur: 'Solde (€)', Valeur: solde },
        { Indicateur: "Taux d'épargne (%)", Valeur: totalRevenus > 0 ? Math.round((solde / totalRevenus) * 1000) / 10 : 0 },
        { Indicateur: 'Nombre de transactions', Valeur: nbTransactions },
        { Indicateur: '', Valeur: '' },
        { Indicateur: '--- Top catégories de dépense ---', Valeur: '' },
        ...depensesParCategorie.slice(0, 10).map(c => ({ Indicateur: c.nom, Valeur: c.montant })),
    ]
    const wsSnapshot = XLSX.utils.json_to_sheet(feuilleSnapshot, { skipHeader: true })
    wsSnapshot['!cols'] = [{ wch: 30 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(workbook, wsSnapshot, 'Snapshot')

    // ─── Téléchargement ───
    const nomFichier = `Fondora_Bilan_${MOIS_NOMS[mois - 1]}_${annee}.xlsx`
    XLSX.writeFile(workbook, nomFichier)
}