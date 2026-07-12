/**
 * GraphiqueFraisComparatif
 * Composant Recharts — Étape 11.1 | Fondora
 *
 * Affiche sur 30 ans l'évolution du capital avec les frais actuels du contrat
 * VS un contrat optimisé à 0,50 % d'enveloppe, sur la base d'un rendement
 * théorique de 6 %/an (brut avant frais).
 *
 * La zone colorée entre les deux courbes représente le manque à gagner cumulé.
 *
 * Props :
 *   valeurActuelle  {number} — Valeur actuelle du contrat en €
 *   fraisEnveloppe  {number} — Frais d'enveloppe actuels en % (ex: 1.50)
 *   fraisTerMoyen   {number} — TER moyen des UC en % (ex: 0.20)
 */

import { useMemo } from 'react'
import { useIncognito } from '../../context/IncognitoContext'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import { genererDonneesGraphiqueFrais } from '../../lib/financialCalculations'
import { formatCurrency } from '../../lib/financialCalculations'

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────

function TooltipFrais({ active, payload, label }) {
    const { incognito } = useIncognito()
    if (!active || !payload || payload.length === 0) return null

    const optimise = payload.find((p) => p.dataKey === 'capitalOptimise')
    const actuel = payload.find((p) => p.dataKey === 'capitalActuel')
    const ecart = (optimise?.value || 0) - (actuel?.value || 0)

    return (
        <div
            style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: '200px',
            }}
        >
            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                Année {label}
            </p>
            {optimise && (
                <p style={{ color: '#6ee7b7', fontSize: '13px', margin: '4px 0' }}>
                    <span style={{ opacity: 0.7 }}>Optimisé&nbsp;</span>
                    <strong>{incognito ? '••••' : formatCurrency(optimise.value)}</strong>
                </p>
            )}
            {actuel && (
                <p style={{ color: '#f87171', fontSize: '13px', margin: '4px 0' }}>
                    <span style={{ opacity: 0.7 }}>Actuel&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    <strong>{incognito ? '••••' : formatCurrency(actuel.value)}</strong>
                </p>
            )}
            {ecart > 1 && (
                <p
                    style={{
                        color: '#fbbf24',
                        fontSize: '12px',
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    Manque à gagner : <strong>{incognito ? '••••' : formatCurrency(ecart)}</strong>
                </p>
            )}
        </div>
    )
}

// ─── Formateurs d'axes ────────────────────────────────────────────────────────

function formaterYAxis(value) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k€`
    return `${value}€`
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function GraphiqueFraisComparatif({ valeurActuelle, fraisEnveloppe, fraisTerMoyen }) {
    const { incognito } = useIncognito()
    const donnees = useMemo(
        () => genererDonneesGraphiqueFrais(valeurActuelle, fraisEnveloppe, fraisTerMoyen),
        [valeurActuelle, fraisEnveloppe, fraisTerMoyen]
    )

    // Manque à gagner aux horizons clés (points 9, 19, 29 = indices 0-based)
    const horizons = useMemo(() => {
        const pts = [9, 19, 29].map((i) => donnees[i]).filter(Boolean)
        return pts.map((p) => ({
            annee: p.annee,
            ecart: Math.max(0, p.capitalOptimise - p.capitalActuel),
        }))
    }, [donnees])

    const fraisTotalPct = (fraisEnveloppe + fraisTerMoyen).toFixed(2)
    const alerteActive = fraisEnveloppe > 1

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* En-tête */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3
                        style={{
                            color: '#f1f5f9',
                            fontSize: '16px',
                            fontWeight: 700,
                            margin: 0,
                        }}
                    >
                        Simulateur de manque à gagner
                    </h3>
                    {alerteActive && (
                        <span
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                        >
                            ⚠ Frais enveloppe élevés
                        </span>
                    )}
                </div>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                    Frais actuels : <strong style={{ color: '#94a3b8' }}>{fraisTotalPct} %</strong>
                    &nbsp;(enveloppe {fraisEnveloppe} % + TER {fraisTerMoyen.toFixed(2)} %)
                    &nbsp;vs contrat optimisé à 0,50 % — rendement théorique 6 %/an
                </p>
            </div>

            {/* Graphique */}
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={donnees} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradOptimise" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradActuel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

                    <XAxis
                        dataKey="annee"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `A${v}`}
                    />
                    <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => incognito ? '••••' : formaterYAxis(v)}
                        width={60}
                    />

                    <Tooltip content={<TooltipFrais />} />

                    <Legend
                        wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }}
                        formatter={(value) =>
                            value === 'capitalOptimise'
                                ? 'Contrat optimisé (0,50 %)'
                                : `Contrat actuel (${fraisEnveloppe} %)`
                        }
                    />

                    {/* Zone supérieure : capital avec frais optimisés */}
                    <Area
                        type="monotone"
                        dataKey="capitalOptimise"
                        stroke="#6ee7b7"
                        strokeWidth={2}
                        fill="url(#gradOptimise)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#6ee7b7' }}
                    />
                    {/* Zone inférieure : capital avec frais actuels */}
                    <Area
                        type="monotone"
                        dataKey="capitalActuel"
                        stroke="#f87171"
                        strokeWidth={2}
                        fill="url(#gradActuel)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#f87171' }}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Résumé aux horizons clés */}
            {horizons.some((h) => h.ecart > 0) && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginTop: '20px',
                    }}
                >
                    {horizons.map(({ annee, ecart }) => (
                        <div
                            key={annee}
                            style={{
                                background: 'rgba(251, 191, 36, 0.06)',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                borderRadius: '10px',
                                padding: '12px',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 4px' }}>
                                Manque à gagner à {annee} ans
                            </p>
                            <p
                                style={{
                                    color: '#fbbf24',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    margin: 0,
                                }}
                            >
                                {formatCurrency(ecart)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
