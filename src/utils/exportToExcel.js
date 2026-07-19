// /src/utils/exportToExcel.js
import ExcelJS from 'exceljs';
import { styles } from './excelStyles';

// Couleurs Fondora
const COLORS = {
  navy: '#1E293B',
  emerald: '#10B981',
  slate: '#64748B',
  lightSlate: '#F1F5F9',
  white: '#FFFFFF',
  negative: '#EF4444',
};

// Fonction pour créer un classeur Excel
const createWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Fondora';
  workbook.lastModifiedBy = 'Fondora';
  workbook.created = new Date();
  workbook.modified = new Date();
  return workbook;
};

// Fonction pour ajouter une feuille "Résumé Mensuel" avec graphique camembert
const addResumeMensuelSheet = (workbook, budgetData, transactions) => {
  const totalRevenus = budgetData.totalRevenus || transactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + Number(t.montant), 0);
  const totalDepenses = budgetData.totalDepenses || transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + Number(t.montant), 0);
  const solde = totalRevenus - totalDepenses;

  const worksheet = workbook.addWorksheet('Résumé Mensuel');

  // En-têtes
  worksheet.columns = [
    { header: 'Catégorie', key: 'categorie', width: 20 },
    { header: 'Montant', key: 'montant', width: 20 },
    { header: 'Pourcentage', key: 'pourcentage', width: 20 },
  ];

  // Ajouter les données
  worksheet.addRow({ categorie: 'Revenus', montant: totalRevenus, pourcentage: `${(totalRevenus / (totalRevenus + totalDepenses) * 100).toFixed(2)}%` });
  worksheet.addRow({ categorie: 'Dépenses', montant: totalDepenses, pourcentage: `${(totalDepenses / (totalRevenus + totalDepenses) * 100).toFixed(2)}%` });
  worksheet.addRow({ categorie: 'Solde', montant: solde, pourcentage: '-' });

  // Appliquer les styles
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 14, color: { argb: COLORS.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };
  });

  // Style pour les lignes de données
  for (let i = 2; i <= 4; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.style = {
        font: { size: 10, color: { argb: COLORS.slate } },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      };
    });
  }

  // Ajouter un graphique camembert
  const pieChart = workbook.addChart({
    type: 'pie',
    series: [
      { data: [totalRevenus, totalDepenses], labels: ['Revenus', 'Dépenses'] },
    ],
    title: { text: 'Répartition Revenus/Dépenses', font: { size: 14, color: { argb: COLORS.navy } } },
    legend: { position: 'right' },
    fill: { series: [COLORS.emerald, COLORS.negative] },
  });

  worksheet.addChart(pieChart, 'E2');
};

// Fonction pour ajouter une feuille "Transactions" avec graphique en barres
const addTransactionsSheet = (workbook, transactions, accounts) => {
  const worksheet = workbook.addWorksheet('Transactions');

  // En-têtes
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Libellé', key: 'libelle', width: 30 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Catégorie', key: 'categorie', width: 20 },
    { header: 'Compte', key: 'compte', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
  ];

  // Ajouter les transactions
  transactions.forEach((t) => {
    const account = accounts.find(a => a.id === t.compte_id);
    worksheet.addRow({
      date: t.date,
      libelle: t.description || t.categories?.nom || 'Sans description',
      montant: t.type === 'revenu' ? t.montant : -t.montant,
      categorie: t.categories?.nom || 'Non catégorisé',
      compte: account?.nom || 'Compte inconnu',
      type: t.type === 'revenu' ? 'Revenu' : 'Dépense',
    });
  });

  // Appliquer les styles
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 14, color: { argb: COLORS.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };
  });

  // Style pour les lignes de données
  for (let i = 2; i <= transactions.length + 1; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.style = {
        font: { size: 10, color: { argb: COLORS.slate } },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      };
    });
  }

  // Ajouter un graphique en barres pour les top 5 catégories
  const categories = {};
  transactions.forEach((t) => {
    const categoryName = t.categories?.nom || 'Non catégorisé';
    categories[categoryName] = (categories[categoryName] || 0) + (t.type === 'revenu' ? Number(t.montant) : -Number(t.montant));
  });

  const topCategories = Object.entries(categories)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5);

  const barChart = workbook.addChart({
    type: 'bar',
    series: [
      { data: topCategories.map(c => Math.abs(c[1])), labels: topCategories.map(c => c[0]) },
    ],
    title: { text: 'Top 5 Catégories (Montant absolu)', font: { size: 14, color: { argb: COLORS.navy } } },
    fill: { series: [COLORS.emerald] },
  });

  worksheet.addChart(barChart, `H${transactions.length + 3}`);
};

// Fonction pour ajouter une feuille "Comptes" avec graphique en barres
const addComptesSheet = (workbook, accounts, transactions) => {
  const worksheet = workbook.addWorksheet('Comptes');

  // En-têtes
  worksheet.columns = [
    { header: 'Compte', key: 'compte', width: 20 },
    { header: 'Solde Initial', key: 'soldeInitial', width: 20 },
    { header: 'Total Revenus', key: 'totalRevenus', width: 20 },
    { header: 'Total Dépenses', key: 'totalDepenses', width: 20 },
    { header: 'Solde Final', key: 'soldeFinal', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
  ];

  // Ajouter les comptes
  accounts.forEach((account) => {
    const accountTransactions = transactions.filter(t => t.compte_id === account.id);
    const totalRevenus = accountTransactions.filter(t => t.type === 'revenu').reduce((sum, t) => sum + Number(t.montant), 0);
    const totalDepenses = accountTransactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + Number(t.montant), 0);
    const soldeFinal = Number(account.soldeReel || account.solde || 0);

    worksheet.addRow({
      compte: account.nom,
      soldeInitial: Number(account.solde || 0),
      totalRevenus,
      totalDepenses,
      soldeFinal,
      type: account.type || 'Non spécifié',
    });
  });

  // Appliquer les styles
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 14, color: { argb: COLORS.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };
  });

  // Style pour les lignes de données
  for (let i = 2; i <= accounts.length + 1; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.style = {
        font: { size: 10, color: { argb: COLORS.slate } },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      };
    });
  }

  // Ajouter un graphique en barres pour les soldes finaux
  const barChart = workbook.addChart({
    type: 'bar',
    series: [
      { data: accounts.map(c => c.soldeReel || c.solde || 0), labels: accounts.map(c => c.nom) },
    ],
    title: { text: 'Soldes Finaux par Compte', font: { size: 14, color: { argb: COLORS.navy } } },
    fill: { series: [COLORS.emerald] },
  });

  worksheet.addChart(barChart, `H${accounts.length + 3}`);
};

// Fonction pour ajouter une feuille "Analyse" avec graphique en courbes
const addAnalyseSheet = (workbook, budgetData) => {
  const worksheet = workbook.addWorksheet('Analyse');

  // En-têtes
  worksheet.columns = [
    { header: 'Mois', key: 'mois', width: 15 },
    { header: 'Prévu', key: 'prevus', width: 15 },
    { header: 'Réel', key: 'reel', width: 15 },
  ];

  // Ajouter des données fictives (à remplacer par vos données réelles)
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
  months.forEach((month) => {
    worksheet.addRow({
      mois: month,
      prevus: budgetData.monthlyBudget || 0,
      reel: budgetData.monthlyActual || 0,
    });
  });

  // Appliquer les styles
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 14, color: { argb: COLORS.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
    };
  });

  // Style pour les lignes de données
  for (let i = 2; i <= months.length + 1; i++) {
    worksheet.getRow(i).eachCell((cell) => {
      cell.style = {
        font: { size: 10, color: { argb: COLORS.slate } },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
      };
    });
  }

  // Ajouter un graphique en courbes
  const lineChart = workbook.addChart({
    type: 'line',
    series: [
      { data: months.map(() => budgetData.monthlyBudget || 0), labels: months, name: 'Prévu' },
      { data: months.map(() => budgetData.monthlyActual || 0), labels: months, name: 'Réel' },
    ],
    title: { text: 'Budget Prévu vs. Réel', font: { size: 14, color: { argb: COLORS.navy } } },
    fill: { series: [COLORS.emerald, COLORS.negative] },
  });

  worksheet.addChart(lineChart, 'E2');
};

// Fonction principale d'export
export const exportBudgetToExcel = async (budgetData, transactions, accounts) => {
  const workbook = createWorkbook();

  // Ajouter les feuilles
  addResumeMensuelSheet(workbook, budgetData, transactions);
  addTransactionsSheet(workbook, transactions, accounts);
  addComptesSheet(workbook, accounts, transactions);
  addAnalyseSheet(workbook, budgetData);

  // Générer le fichier
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fondora_Budget_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};