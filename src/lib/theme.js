// src/lib/theme.js
export const THEME = {
    bg: {
        page: '#0a0f1d',
        surface: '#111a2c',
        card: '#1a2537',
        cardHover: '#1e2b40',
    },
    border: 'rgba(148, 163, 184, 0.08)',
    borderStrong: '#334155',
    text: {
        h: '#f8fafc',
        base: '#94a3b8',
        muted: '#64748b',
    },
    positive: '#34d399',
    negative: '#f87171',
    accent: {
        main: '#10b981',
        light: '#34d399',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.3)',
    },
    accent2: '#6366f1', // indigo
    accent3: '#f59e0b', // ambre
}

// Config Recharts réutilisable dans tous les graphiques
export const CHART_THEME = {
    grid: { stroke: 'rgba(148,163,184,0.1)' },
    axis: { fill: THEME.text.muted, fontSize: 11 },
    tooltip: {
        contentStyle: {
            background: THEME.bg.card,
            border: `1px solid ${THEME.borderStrong}`,
            borderRadius: 12,
            color: THEME.text.h,
        },
        labelStyle: { color: THEME.text.muted },
        itemStyle: { color: THEME.text.h, fontWeight: 600 },
    },
    colors: [THEME.accent.main, THEME.accent2, THEME.accent3, THEME.negative],
}