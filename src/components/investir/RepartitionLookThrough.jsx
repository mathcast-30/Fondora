import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useLookThrough } from '../../hooks/useLookThrough'

const PALETTE = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#3b82f6', '#eab308', '#64748b']
const GRIS_NON_COUVERT = '#334155'

function Donut({ titre, dimension, data, onSegmentClick, segmentSelectionne }) {
    if (!data.lignes.length) return null
    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-h)' }}>{titre}</p>
                <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: data.tauxCouverture >= 70 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: data.tauxCouverture >= 70 ? '#10b981' : '#f59e0b',
                }}>
                    {data.tauxCouverture}% couvert
                </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data.lignes}
                        dataKey="pourcentage"
                        nameKey="libelle"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={1}
                        cursor={onSegmentClick ? 'pointer' : 'default'}
                        onClick={(entry) => {
                            if (onSegmentClick && entry?.libelle && entry.libelle !== 'Non couvert') {
                                onSegmentClick(dimension, entry.libelle)
                            }
                        }}
                    >
                        {data.lignes.map((l, i) => {
                            const isSelected = segmentSelectionne?.dimension === dimension && segmentSelectionne?.libelle === l.libelle
                            return (
                                <Cell
                                    key={l.libelle}
                                    fill={l.libelle === 'Non couvert' ? GRIS_NON_COUVERT : PALETTE[i % PALETTE.length]}
                                    stroke={isSelected ? '#fff' : 'none'}
                                    strokeWidth={isSelected ? 3 : 0}
                                />
                            )
                        })}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1a2537', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                {data.lignes.map((l, i) => {
                    const isSelected = segmentSelectionne?.dimension === dimension && segmentSelectionne?.libelle === l.libelle
                    return (
                        <button
                            key={l.libelle}
                            type="button"
                            onClick={() => {
                                if (onSegmentClick && l.libelle !== 'Non couvert') {
                                    onSegmentClick(dimension, l.libelle)
                                }
                            }}
                            className={`text-left transition-all ${onSegmentClick && l.libelle !== 'Non couvert' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                            style={{
                                fontSize: 11,
                                color: isSelected ? 'var(--text-h)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: 'none'
                            }}
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.libelle === 'Non couvert' ? GRIS_NON_COUVERT : PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                            <span>{l.libelle} ({l.pourcentage}%)</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default function RepartitionLookThrough({ positions, onSegmentClick, segmentSelectionne }) {
    const { loading, geo, secteur } = useLookThrough(positions)
    if (loading || !positions?.length) return null

    return (
        <div style={{ marginTop: 20 }}>
            <div className="flex items-center justify-between mb-1">
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-h)', margin: 0 }}>🌍 Analyse sectorielle & géographique</p>
                {segmentSelectionne && onSegmentClick && (
                    <button
                        type="button"
                        onClick={() => onSegmentClick(null, null)}
                        className="text-xs text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
                    >
                        Réinitialiser le filtre ({segmentSelectionne.libelle}) ✕
                    </button>
                )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Décomposition "look-through" du contenu réel de tes ETF (données indicatives, saisies manuellement pour les ETF les plus courants — le reste apparaît en gris "Non couvert").
                {onSegmentClick && ' Clique sur un segment pour filtrer les positions.'}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Donut titre="Répartition géographique" dimension="geographique" data={geo} onSegmentClick={onSegmentClick} segmentSelectionne={segmentSelectionne} />
                <Donut titre="Répartition sectorielle" dimension="sectoriel" data={secteur} onSegmentClick={onSegmentClick} segmentSelectionne={segmentSelectionne} />
            </div>
        </div>
    )
}