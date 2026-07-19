// /src/utils/excelStyles.js
// Couleurs Fondora
const COLORS = {
  navy: '#1E293B',
  emerald: '#10B981',
  slate: '#64748B',
  lightSlate: '#F1F5F9',
  white: '#FFFFFF',
  negative: '#EF4444', // Rouge pour les dépenses
};

// Styles réutilisables pour Excel
export const styles = {
  // Style pour les en-têtes de tableau
  header: {
    font: {
      bold: true,
      size: 14,
      color: { rgb: COLORS.white },
    },
    fill: {
      fgColor: { rgb: COLORS.navy },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.slate } },
      bottom: { style: 'thin', color: { rgb: COLORS.slate } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },

  // Style pour les sous-en-têtes
  subHeader: {
    font: {
      bold: true,
      size: 12,
      color: { rgb: COLORS.navy },
    },
    fill: {
      fgColor: { rgb: COLORS.lightSlate },
    },
    alignment: {
      horizontal: 'left',
      vertical: 'center',
    },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.slate } },
      bottom: { style: 'thin', color: { rgb: COLORS.slate } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },

  // Style pour les lignes de totaux
  totalRow: {
    font: {
      bold: true,
      size: 11,
      color: { rgb: COLORS.navy },
    },
    fill: {
      fgColor: { rgb: COLORS.emerald },
    },
    border: {
      top: { style: 'thick', color: { rgb: COLORS.navy } },
      bottom: { style: 'thick', color: { rgb: COLORS.navy } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },

  // Style pour les cellules normales
  cell: {
    font: {
      size: 10,
      color: { rgb: COLORS.slate },
    },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.slate } },
      bottom: { style: 'thin', color: { rgb: COLORS.slate } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },

  // Style pour les montants positifs (revenus)
  positiveAmount: {
    font: {
      size: 10,
      color: { rgb: COLORS.emerald },
    },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.slate } },
      bottom: { style: 'thin', color: { rgb: COLORS.slate } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },

  // Style pour les montants négatifs (dépenses)
  negativeAmount: {
    font: {
      size: 10,
      color: { rgb: COLORS.negative },
    },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.slate } },
      bottom: { style: 'thin', color: { rgb: COLORS.slate } },
      left: { style: 'thin', color: { rgb: COLORS.slate } },
      right: { style: 'thin', color: { rgb: COLORS.slate } },
    },
  },
};
