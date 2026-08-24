import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useLookThrough } from '../../hooks/useLookThrough'

const PALETTE = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#3b82f6', '#eab308', '#64748b']
const GRIS_NON_COUVERT = '#334155'

function Donut({ titre, data }) {
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
                    <Pie data={data.lignes} dataKey="pourcentage" nameKey="libelle" innerRadius={55} outerRadius={85} paddingAngle={1}>
                        {data.lignes.map((l, i) => (
                            <Cell key={l.libelle} fill={l.libelle === 'Non couvert' ? GRIS_NON_COUVERT : PALETTE[i % PALETTE.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1a2537', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                {data.lignes.map((l, i) => (
                    <span key={l.libelle} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.libelle === 'Non couvert' ? GRIS_NON_COUVERT : PALETTE[i % PALETTE.length] }} />
                        {l.libelle} ({l.pourcentage}%)
                    </span>
                ))}
            </div>
        </div>
    )
}

export default function RepartitionLookThrough({ positions }) {
    const { loading, geo, secteur } = useLookThrough(positions)
    if (loading || !positions?.length) return null

    return (
        <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-h)', marginBottom: 4 }}>🌍 Analyse sectorielle & géographique</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Décomposition "look-through" du contenu réel de tes ETF (données indicatives, saisies manuellement pour les ETF les plus courants — le reste apparaît en gris "Non couvert").
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Donut titre="Répartition géographique" data={geo} />
                <Donut titre="Répartition sectorielle" data={secteur} />
            </div>
        </div>
    )
}