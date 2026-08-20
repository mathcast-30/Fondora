import { useState } from 'react'
import { useEntiteMembres } from '../hooks/useEntiteMembres'

const TYPES_DETENTION = [
    { value: 'pleine_propriete', label: 'Pleine propriété' },
    { value: 'usufruit', label: 'Usufruit' },
    { value: 'nue_propriete', label: 'Nue-propriété' },
]
const IN = { padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-h)', fontSize: 13 }

export default function RepartitionEntitePanel({ entite, entitesPersonnes }) {
    const { repartition, loading, ajouterPart, modifierPart, supprimerPart, totalPourcentage } = useEntiteMembres(entite?.id)
    const [form, setForm] = useState({ membre_entite_id: '', pourcentage: '', type_detention: 'pleine_propriete' })
    const [erreur, setErreur] = useState(null)
    if (!entite) return null

    const disponibles = entitesPersonnes.filter(p =>
        !repartition.some(r => r.membre_entite_id === p.id && r.type_detention === form.type_detention))

    const handleAjouter = async (e) => {
        e.preventDefault(); setErreur(null)
        if (!form.membre_entite_id || !form.pourcentage) return
        const pct = parseFloat(form.pourcentage)
        if (pct <= 0 || pct > 100) return setErreur('Le pourcentage doit être entre 0 et 100.')
        if (totalPourcentage + pct > 100) return setErreur(`Total dépasserait 100% (déjà ${totalPourcentage}%).`)
        const { error } = await ajouterPart(form)
        if (error) setErreur(error.message)
        else setForm({ membre_entite_id: '', pourcentage: '', type_detention: 'pleine_propriete' })
    }

    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', margin: 0 }}>Répartition — {entite.nom}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: totalPourcentage === 100 ? '#34d399' : totalPourcentage > 100 ? '#f87171' : '#fbbf24' }}>
                    {totalPourcentage}%{totalPourcentage !== 100 ? ' (incomplet)' : ''}
                </span>
            </div>

            {loading ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chargement…</p> :
                repartition.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Aucune répartition définie.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                        {repartition.map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.membre?.couleur || '#94a3b8', flexShrink: 0 }} />
                                <span style={{ flex: 1, color: 'var(--text-h)' }}>{r.membre?.nom || '—'}</span>
                                <select value={r.type_detention} onChange={(e) => modifierPart(r.id, { type_detention: e.target.value })} style={{ ...IN, padding: '4px 6px', fontSize: 12 }}>
                                    {TYPES_DETENTION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <input type="number" step="0.01" min="0" max="100" value={r.pourcentage}
                                    onChange={(e) => modifierPart(r.id, { pourcentage: parseFloat(e.target.value) || 0 })}
                                    style={{ ...IN, width: 70, padding: '4px 6px', fontSize: 12 }} />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
                                <button onClick={() => supprimerPart(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>
                )}

            {erreur && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{erreur}</p>}

            <form onSubmit={handleAjouter} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select value={form.membre_entite_id} onChange={(e) => setForm(f => ({ ...f, membre_entite_id: e.target.value }))} style={{ ...IN, flex: 1, minWidth: 140 }}>
                    <option value="">— Personne —</option>
                    {disponibles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <select value={form.type_detention} onChange={(e) => setForm(f => ({ ...f, type_detention: e.target.value }))} style={IN}>
                    {TYPES_DETENTION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="number" step="0.01" min="0" max="100" placeholder="%" value={form.pourcentage}
                    onChange={(e) => setForm(f => ({ ...f, pourcentage: e.target.value }))} style={{ ...IN, width: 70 }} />
                <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button>
            </form>
        </div>
    )
}