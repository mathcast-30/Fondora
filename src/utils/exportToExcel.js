// /src/utils/exportToExcel.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { styles } from './excelStyles';
import { addPieChart, addBarChart, addLineChart } from './excelCharts';

// Couleurs Fondora
const COLORS = {
  navy: '#1E293B',
  emerald: '#10B981',
  slate: '#64748B',
  lightSlate: '#F1F5F9',
  white: '#FFFFFF',
  negative: '#EF4444',
};

// Fonction pour appliquer les styles à une plage de cellules
const applyStylesToRange = (worksheet, range, style) => {
  const { s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } } = XLSX.utils.decode_range(range);
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = style;
      }
    }
  }
};

// Fonction pour ajouter une feuille "Résumé Mensuel"
const createResumeMensuelSheet = (workbook, budgetData, transactions, accounts) => {
  const totalRevenus = budgetData.totalRevenus || transactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + Number(t.montant), 0);
  const totalDepenses = budgetData.totalDepenses || transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + Number(t.montant), 0);
  const solde = totalRevenus - totalDepenses;

  const summaryData = [
    { Catégorie: 'Revenus', Montant: totalRevenus, Pourcentage: `${(totalRevenus / (totalRevenus + totalDepenses) * 100).toFixed(2)}%` },
    { Catégorie: 'Dépenses', Montant: totalDepenses, Pourcentage: `${(totalDepenses / (totalRevenus + totalDepenses) * 100).toFixed(2)}%` },
    { Catégorie: 'Solde', Montant: solde, Pourcentage: '-' },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);

  // Appliquer les styles
  applyStylesToRange(summarySheet, 'A1:C1', styles.header);
  applyStylesToRange(summarySheet, 'A2:C4', styles.cell);

  // Ajouter un graphique camembert
  addPieChart(
    summarySheet,
    {
      labels: ['Revenus', 'Dépenses'],
      series: [totalRevenus, totalDepenses],
    },
    'A1:C4',
    'Répartition Revenus/Dépenses'
  );

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé Mensuel');
};

// Fonction pour ajouter une feuille "Transactions"
const createTransactionsSheet = (workbook, transactions, accounts) => {
  const transactionsWithAccountNames = transactions.map(t => {
    const account = accounts.find(a => a.id === t.compte_id);
    return {
      Date: t.date,
      Libellé: t.description || t.categories?.nom || 'Sans description',
      Montant: t.type === 'revenu' ? t.montant : -t.montant,
      Catégorie: t.categories?.nom || 'Non catégorisé',
      Compte: account?.nom || 'Compte inconnu',
      Type: t.type === 'revenu' ? 'Revenu' : 'Dépense',
    };
  });

  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsWithAccountNames);

  // Appliquer les styles
  applyStylesToRange(transactionsSheet, 'A1:F1', styles.header);
  applyStylesToRange(transactionsSheet, `A2:F${transactionsWithAccountNames.length + 1}`, styles.cell);

  // Ajouter un graphique en barres pour les top 5 catégories
  const categories = {};
  transactions.forEach(t => {
    const categoryName = t.categories?.nom || 'Non catégorisé';
    categories[categoryName] = (categories[categoryName] || 0) + (t.type === 'revenu' ? Number(t.montant) : -Number(t.montant));
  });

  const topCategories = Object.entries(categories)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5);

  addBarChart(
    transactionsSheet,
    {
      labels: topCategories.map(c => c[0]),
      series: [topCategories.map(c => Math.abs(c[1]))],
    },
    `A1:F${transactionsWithAccountNames.length + 1}`,
    'Top 5 Catégories (Montant absolu)'
  );

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
};

// Fonction pour ajouter une feuille "Comptes"
const createComptesSheet = (workbook, accounts, transactions) => {
  const comptesData = accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.compte_id === account.id);
    const totalRevenus = accountTransactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + Number(t.montant), 0);
    const totalDepenses = accountTransactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + Number(t.montant), 0);
    const solde = Number(account.soldeReel || account.solde || 0);

    return {
      Compte: account.nom,
      'Solde Initial': Number(account.solde || 0),
      'Total Revenus': totalRevenus,
      'Total Dépenses': totalDepenses,
      'Solde Final': solde,
      Type: account.type || 'Non spécifié',
    };
  });

  const comptesSheet = XLSX.utils.json_to_sheet(comptesData);

  // Appliquer les styles
  applyStylesToRange(comptesSheet, 'A1:F1', styles.header);
  applyStylesToRange(comptesSheet, `A2:F${comptesData.length + 1}`, styles.cell);

  // Ajouter un graphique en barres pour les soldes finaux
  addBarChart(
    comptesSheet,
    {
      labels: comptesData.map(c => c.Compte),
      series: [comptesData.map(c => c['Solde Final'])],
    },
    `A1:F${comptesData.length + 1}`,
    'Soldes Finaux par Compte'
  );

  XLSX.utils.book_append_sheet(workbook, comptesSheet, 'Comptes');
};

// Fonction pour ajouter une feuille "Transfers"
const createTransfersSheet = (workbook, transactions, accounts) => {
  const transfers = transactions.filter(t => t.type === 'transfert');

  if (transfers.length === 0) {
    const emptyTransfersSheet = XLSX.utils.json_to_sheet([{ Message: 'Aucun transfert trouvé.' }]);
    XLSX.utils.book_append_sheet(workbook, emptyTransfersSheet, 'Transfers');
    return;
  }

  const transfersData = transfers.map(t => {
    const sourceAccount = accounts.find(a => a.id === t.compte_id);
    const destinationAccount = accounts.find(a => a.id === t.destination_compte_id);

    return {
      Date: t.date,
      'Compte Source': sourceAccount?.nom || 'Compte inconnu',
      'Compte Destination': destinationAccount?.nom || 'Compte inconnu',
      Montant: t.montant,
      Description: t.description || 'Transfert',
    };
  });

  const transfersSheet = XLSX.utils.json_to_sheet(transfersData);

  // Appliquer les styles
  applyStylesToRange(transfersSheet, 'A1:E1', styles.header);
  applyStylesToRange(transfersSheet, `A2:E${transfersData.length + 1}`, styles.cell);

  XLSX.utils.book_append_sheet(workbook, transfersSheet, 'Transfers');
};

// Fonction pour ajouter une feuille "Analyse"
const createAnalyseSheet = (workbook, budgetData, transactions) => {
  const monthlyData = [
    { Mois: 'Janvier', Prévu: budgetData.monthlyBudget || 0, Réel: budgetData.monthlyActual || 0 },
    { Mois: 'Février', Prévu: budgetData.monthlyBudget || 0, Réel: budgetData.monthlyActual || 0 },
    // Ajoutez d'autres mois si nécessaire
  ];

  const analysisSheet = XLSX.utils.json_to_sheet(monthlyData);

  // Appliquer les styles
  applyStylesToRange(analysisSheet, 'A1:C1', styles.header);
  applyStylesToRange(analysisSheet, 'A2:C3', styles.cell);

  // Ajouter un graphique en courbes pour l'analyse mensuelle
  addLineChart(
    analysisSheet,
    {
      labels: monthlyData.map(d => d.Mois),
      series: [
        monthlyData.map(d => d.Prévu),
        monthlyData.map(d => d.Réel),
      ],
    },
    'A1:C3',
    'Budget Prévu vs. Réel'
  );

  XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analyse');
};

// Fonction principale d'export
export const exportBudgetToExcel = (budgetData, transactions, accounts) => {
  const workbook = XLSX.utils.book_new();

  // Créer les feuilles
  createResumeMensuelSheet(workbook, budgetData, transactions, accounts);
  createTransactionsSheet(workbook, transactions, accounts);
  createComptesSheet(workbook, accounts, transactions);
  createTransfersSheet(workbook, transactions, accounts);
  createAnalyseSheet(workbook, budgetData, transactions);

  // Générer le fichier
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `Fondora_Budget_${new Date().toISOString().split('T')[0]}.xlsx`);
};
