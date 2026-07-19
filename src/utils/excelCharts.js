// /src/utils/excelCharts.js
import { COLORS } from './excelStyles';

// Fonction pour ajouter un graphique camembert
export const addPieChart = (worksheet, data, range, title) => {
  const chart = {
    type: 'pie',
    data: {
      labels: data.labels,
      series: data.series,
    },
    options: {
      title: { display: true, text: title, font: { size: 14, color: { rgb: COLORS.navy } } },
      legend: { position: 'right' },
      colors: [COLORS.emerald, COLORS.negative, COLORS.slate],
    },
  };

  worksheet['!charts'] = worksheet['!charts'] || [];
  worksheet['!charts'].push({
    type: 'pie',
    ref: range,
    chart,
  });
};

// Fonction pour ajouter un graphique en barres
export const addBarChart = (worksheet, data, range, title) => {
  const chart = {
    type: 'bar',
    data: {
      labels: data.labels,
      series: data.series,
    },
    options: {
      title: { display: true, text: title, font: { size: 14, color: { rgb: COLORS.navy } } },
      legend: { position: 'top' },
      colors: [COLORS.emerald, COLORS.negative],
    },
  };

  worksheet['!charts'] = worksheet['!charts'] || [];
  worksheet['!charts'].push({
    type: 'bar',
    ref: range,
    chart,
  });
};

// Fonction pour ajouter un graphique en courbes
export const addLineChart = (worksheet, data, range, title) => {
  const chart = {
    type: 'line',
    data: {
      labels: data.labels,
      series: data.series,
    },
    options: {
      title: { display: true, text: title, font: { size: 14, color: { rgb: COLORS.navy } } },
      legend: { position: 'top' },
      colors: [COLORS.emerald, COLORS.negative],
    },
  };

  worksheet['!charts'] = worksheet['!charts'] || [];
  worksheet['!charts'].push({
    type: 'line',
    ref: range,
    chart,
  });
};
