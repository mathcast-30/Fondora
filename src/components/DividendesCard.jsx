import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import SecureValue from './SecureValue'

function DividendesCard({ dividendes, totalDouzeMois, valorisationTotale, positions, onAjouter, onSupprimer }) {
    const [modalOuvert, setModalOuvert] = useState(false)
    const [form, setForm] = useState({ position_id: '', montant: '', date: new Date().toISOString().split('T')[0] })

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const rendement = valorisationTotale > 0 ? (totalDouzeMois / valorisationTotale) * 100 : 0

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await onAjouter({
            ...form,
            montant: parseFloat(form.montant),
            position_id: form.position_id || null,
        })
        if (!error) {
            setForm({ position_id: '', montant: '', date: new Date().toISOString().split('T')[0] })
            setModalOuvert(false)
        }
    }

    return (
        <div className="bg-card rounded-xl p-5 border border-[var(--border)] mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[var(--text-h)] font-semibold">Dividendes</h3>
                <button onClick={() => setModalOuvert(true)} className="text-emerald hover:text-emerald-light flex items-center gap-1 text-sm font-medium">
                    <Plus size={16} /> Ajouter
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[var(--text)] text-xs mb-1">Dividendes (12 mois)</p>
                    <p className="text-[var(--text-h)] font-bold text-xl"><SecureValue value={totalDouzeMois} formatter={formatMontant} /></p>
                </div>
                <div>
                    <p className="text-[var(--text)] text-xs mb-1">Rendement</p>
                    <p className="text-emerald font-bold text-xl"><SecureValue value={rendement} formatter={v => `${v.toFixed(2)} %`} /></p>
                </div>
            </div>

            {dividendes.length > 0 && (
                <div className="border-t border-[var(--border)] pt-3 space-y-1 max-h-40 overflow-y-auto">
                    {dividendes.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm py-1">
                            <span className="text-[var(--text)]">
                                {d.positions_financieres?.symbole || 'Global'} • {new Date(d.date).toLocaleDateString('fr-FR')}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--text-h)] font-medium"><SecureValue value={d.montant} formatter={formatMontant} /></span>
                                <button onClick={() => onSupprimer(d.id)} className="text-[var(--text-muted)] hover:text-[var(--negative)]">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Ajouter un dividende">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select
                        value={form.position_id}
                        onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2"
                    >
                        <option value="">Dividende global (toutes positions)</option>
                        {positions.map((p) => (
                            <option key={p.id} value={p.id}>{p.symbole}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Montant reçu"
                        value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 placeholder-[var(--text-muted)]"
                    />

                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2"
                    />

                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Ajouter
                    </button>
                </form>
            </Modal>
        </div>
    )
}

export default DividendesCard