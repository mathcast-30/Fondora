import * as XLSX from 'xlsx'

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export function genererBilanBudget({ transactions = [], budgets = [], categories = [], mois, annee, totalRevenus = 0, totalDepenses = 0, solde = 0 }) {
    const workbook = XLSX.utils.book_new()
    const periodeLabel = `${MOIS_NOMS[mois - 1]} ${annee}`

    // Feuille 1 : Transactions
    const feuilleTransactions = transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString('fr-FR'),
        Description: t.description || t.categories?.nom || '',
        Catégorie: t.categories?.nom || 'Non catégorisé',
        Compte: t.comptes?.nom || '',
        Type: t.type === 'revenu' ? 'Revenu' : 'Dépense',
        'Montant (€)': t.type === 'revenu' ? Number(t.montant) : -Number(t.montant),
        Récurrente: t.recurrente ? 'Oui' : 'Non',
    }))
    const wsTransactions = XLSX.utils.json_to_sheet(feuilleTransactions)
    wsTransactions['!cols'] = [{ wch: 12 },{ wch: 30 },{ wch: 20 },{ wch: 18 },{ wch: 10 },{ wch: 14 },{ wch: 12 }]
    XLSX.utils.book_append_sheet(workbook, wsTransactions, 'Transactions')

    // Feuille 2 : Rapport Budget par catégorie
    const depensesParCategorie = categories.map(cat => {
        const budget = budgets.find(b => b.categorie_id === cat.id)
        const depense = transactions
            .filter(t => t.type === 'depense' && t.categorie_id === cat.id)
            .reduce((s, t) => s + Number(t.montant), 0)
        const alloue = budget ? Number(budget.montant_max) : 0
        return {
            Catégorie: cat.nom,
            'Alloué (€)': alloue,
            'Dépensé (€)': depense,
            'Restant (€)': alloue - depense,
            '% Utilisé': alloue > 0 ? Math.round((depense / alloue) * 100) + '%' : 'N/A',
        }
    }).filter(r => r['Dépensé (€)'] > 0 || r['Alloué (€)'] > 0)

    const wsBudget = XLSX.utils.json_to_sheet(depensesParCategorie)
    wsBudget['!cols'] = [{ wch: 22 },{ wch: 14 },{ wch: 14 },{ wch: 14 },{ wch: 12 }]
    XLSX.utils.book_append_sheet(workbook, wsBudget, 'Budget par catégorie')

    // Feuille 3 : Synthèse
    const synthese = [
        { Indicateur: 'Période', Valeur: periodeLabel },
        { Indicateur: 'Total Revenus', Valeur: totalRevenus },
        { Indicateur: 'Total Dépenses', Valeur: totalDepenses },
        { Indicateur: 'Solde', Valeur: solde },
        { Indicateur: 'Nb transactions', Valeur: transactions.length },
    ]
    const wsSynthese = XLSX.utils.json_to_sheet(synthese)
    wsSynthese['!cols'] = [{ wch: 22 },{ wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, wsSynthese, 'Synthèse')

    XLSX.writeFile(workbook, `Fondora_Budget_${periodeLabel.replace(' ', '_')}.xlsx`)
}