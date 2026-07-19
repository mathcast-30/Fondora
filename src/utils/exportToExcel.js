import ExcelJS from 'exceljs'
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PieController, BarController } from 'chart.js'

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PieController, BarController)

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

// Couleurs Fondora
const C = {
  navy: 'FF1E293B',
  emerald: 'FF10B981',
  red: 'FFEF4444',
  slate: 'FF64748B',
  white: 'FFFFFFFF',
  bg: 'FF0A0F1D',
  surface: 'FF161B2C',
}

// Helper : style en-tête colonne
function styleHeader(cell) {
  cell.font = { bold: true, color: { argb: C.white }, size: 11 }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
}

// Helper : style ligne données
function styleRow(row, isEven) {
  row.eachCell(cell => {
    cell.font = { size: 10, color: { argb: C.slate } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FF1E293B' : 'FF0F172A' } }
    cell.border = { top: { style: 'hair' }, left: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } }
  })
}

// Helper : générer un PNG base64 depuis Chart.js sur canvas hors DOM
async function genererChartPNG(type, labels, datasets, titre) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    const chart = new Chart(ctx, {
      type,
      data: { labels, datasets },
      options: {
        animation: false,
        responsive: false,
        plugins: {
          legend: { labels: { color: '#94A3B8', font: { size: 12 } } },
          title: { display: true, text: titre, color: '#F1F5F9', font: { size: 14, weight: 'bold' } },
        },
        scales: type === 'bar' ? {
          x: { ticks: { color: '#94A3B8' }, grid: { color: '#1E293B' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: '#1E293B' } },
        } : undefined,
      },
    })

    // Chart.js avec animation:false rend immédiatement
    setTimeout(() => {
      const png = canvas.toDataURL('image/png').split(',')[1]
      chart.destroy()
      resolve(png)
    }, 100)
  })
}

// ─── Feuille 1 : Synthèse + graphique camembert Revenus/Dépenses ───
async function addSyntheseSheet(wb, { totalRevenus, totalDepenses, solde, mois, annee, transactions }) {
  const ws = wb.addWorksheet('Synthèse')
  const periode = `${MOIS_NOMS[mois - 1]} ${annee}`

  ws.columns = [
    { key: 'indicateur', width: 28 },
    { key: 'valeur', width: 20 },
  ]

  // Titre
  ws.mergeCells('A1:B1')
  const titreCell = ws.getCell('A1')
  titreCell.value = `📊 Bilan Budget — ${periode}`
  titreCell.font = { bold: true, size: 16, color: { argb: C.white } }
  titreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.bg } }
  titreCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 36

  const lignes = [
    ['Période', periode],
    ['Total Revenus', totalRevenus],
    ['Total Dépenses', totalDepenses],
    ['Solde Net', solde],
    ['Nombre de transactions', transactions.length],
    ['Taux d\'épargne', totalRevenus > 0 ? `${((solde / totalRevenus) * 100).toFixed(1)}%` : 'N/A'],
  ]

  lignes.forEach(([ind, val], i) => {
    const row = ws.addRow({ indicateur: ind, valeur: val })
    styleRow(row, i % 2 === 0)
    if (typeof val === 'number') {
      row.getCell('valeur').numFmt = '#,##0.00 "€"'
      row.getCell('valeur').font = {
        size: 10,
        bold: true,
        color: { argb: val >= 0 ? C.emerald : C.red }
      }
    }
  })

  // Graphique camembert
  const pngBase64 = await genererChartPNG('pie',
    ['Revenus', 'Dépenses'],
    [{
      data: [totalRevenus, totalDepenses],
      backgroundColor: ['#10B981', '#EF4444'],
      borderColor: ['#0A0F1D'],
      borderWidth: 2,
    }],
    `Revenus vs Dépenses — ${periode}`
  )
  const imageId = wb.addImage({ base64: pngBase64, extension: 'png' })
  ws.addImage(imageId, { tl: { col: 3, row: 1 }, ext: { width: 480, height: 290 } })
}

// ─── Feuille 2 : Transactions ───
function addTransactionsSheet(wb, transactions, comptes) {
  const ws = wb.addWorksheet('Transactions')
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Description', key: 'desc', width: 32 },
    { header: 'Catégorie', key: 'cat', width: 20 },
    { header: 'Compte', key: 'compte', width: 18 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Montant (€)', key: 'montant', width: 16 },
  ]

  ws.getRow(1).eachCell(styleHeader)
  ws.getRow(1).height = 28

  transactions.forEach((t, i) => {
    const compte = comptes?.find(c => c.id === t.compte_id)
    const montant = t.type === 'revenu' ? Number(t.montant) : -Number(t.montant)
    const row = ws.addRow({
      date: new Date(t.date).toLocaleDateString('fr-FR'),
      desc: t.description || t.categories?.nom || '',
      cat: t.categories?.nom || 'Non catégorisé',
      compte: compte?.nom || '',
      type: t.type === 'revenu' ? 'Revenu' : 'Dépense',
      montant,
    })
    styleRow(row, i % 2 === 0)
    const mCell = row.getCell('montant')
    mCell.numFmt = '#,##0.00 "€"'
    mCell.font = { size: 10, bold: true, color: { argb: montant >= 0 ? C.emerald : C.red } }
  })
}

// ─── Feuille 3 : Budget par catégorie + graphique barres ───
async function addBudgetSheet(wb, { budgets, categories, transactions }) {
  const ws = wb.addWorksheet('Budget par catégorie')
  ws.columns = [
    { header: 'Catégorie', key: 'cat', width: 22 },
    { header: 'Alloué (€)', key: 'alloue', width: 16 },
    { header: 'Dépensé (€)', key: 'depense', width: 16 },
    { header: 'Restant (€)', key: 'restant', width: 16 },
    { header: '% Utilisé', key: 'pct', width: 14 },
  ]
  ws.getRow(1).eachCell(styleHeader)
  ws.getRow(1).height = 28

  const rows = categories.map(cat => {
    const budget = budgets.find(b => b.categorie_id === cat.id)
    const depense = transactions
      .filter(t => t.type === 'depense' && t.categorie_id === cat.id)
      .reduce((s, t) => s + Number(t.montant), 0)
    const alloue = budget ? Number(budget.montant_max) : 0
    return { cat: cat.nom, alloue, depense, restant: alloue - depense, pct: alloue > 0 ? depense / alloue : 0 }
  }).filter(r => r.depense > 0 || r.alloue > 0)

  rows.forEach((r, i) => {
    const row = ws.addRow(r)
    styleRow(row, i % 2 === 0)
      ;['alloue', 'depense', 'restant'].forEach(k => {
        row.getCell(k).numFmt = '#,##0.00 "€"'
      })
    const pctCell = row.getCell('pct')
    pctCell.numFmt = '0%'
    pctCell.font = { size: 10, bold: true, color: { argb: r.pct > 1 ? C.red : C.emerald } }
  })

  // Graphique barres top catégories
  if (rows.length > 0) {
    const top = rows.sort((a, b) => b.depense - a.depense).slice(0, 8)
    const pngBase64 = await genererChartPNG('bar',
      top.map(r => r.cat),
      [{
        label: 'Dépensé',
        data: top.map(r => r.depense),
        backgroundColor: '#10B981',
        borderColor: '#0A0F1D',
        borderWidth: 1,
      }, {
        label: 'Alloué',
        data: top.map(r => r.alloue),
        backgroundColor: '#334155',
        borderColor: '#0A0F1D',
        borderWidth: 1,
      }],
      'Budget Alloué vs Réel par Catégorie'
    )
    const imageId = wb.addImage({ base64: pngBase64, extension: 'png' })
    ws.addImage(imageId, { tl: { col: 6, row: 1 }, ext: { width: 500, height: 300 } })
  }
}

// ─── Fonction principale exportée ───
export async function exportBudgetToExcel({ transactions = [], budgets = [], categories = [], comptes = [], mois, annee, totalRevenus = 0, totalDepenses = 0, solde = 0 }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Fondora'
  wb.created = new Date()

  await addSyntheseSheet(wb, { totalRevenus, totalDepenses, solde, mois, annee, transactions })
  addTransactionsSheet(wb, transactions, comptes)
  await addBudgetSheet(wb, { budgets, categories, transactions })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Fondora_Budget_${MOIS_NOMS[mois - 1]}_${annee}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}