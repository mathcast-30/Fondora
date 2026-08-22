import { useState } from 'react'
import { useEntiteInfo } from '../hooks/useEntiteInfo'

const LABEL_DETENTION = { pleine_propriete: 'PP', usufruit: 'USF', nue_propriete: 'NP' }

export default function BadgeProprietaire({ entiteId, style }) {
    const { entite, repartition, loading, estStructure } = useEntiteInfo(entiteId)
    const [ouvert, setOuvert] = useState(false)
    if (!entiteId || loading || !entite) return null

    return (
        <span style={{ position: 'relative', display: 'inline-block', ...style }}>
            <button
                onClick={() => estStructure && setOuvert(v => !v)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: `${entite.couleur}18`, border: `1px solid ${entite.couleur}40`,
                    borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600,
                    color: entite.couleur, cursor: estStructure ? 'pointer' : 'default',
                }}
            >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: entite.couleur }} />
                {entite.nom}
                {estStructure && <span style={{ fontSize: 9, opacity: 0.7 }}>{ouvert ? '▲' : '▼'}</span>}
            </button>

            {estStructure && ouvert && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 20,
                    background: '#1a2537', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    padding: 10, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                    {repartition.length === 0 ? (
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Répartition non définie</p>
                    ) : repartition.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '3px 0' }}>
                            <span style={{ color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.membre?.couleur || '#94a3b8' }} />
                                {r.membre?.nom}
                            </span>
                            <span style={{ color: '#94a3b8' }}>{r.pourcentage}% · {LABEL_DETENTION[r.type_detention]}</span>
                        </div>
                    ))}
                </div>
            )}
        </span>
    )
}