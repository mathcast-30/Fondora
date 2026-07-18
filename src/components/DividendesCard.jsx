import { useState } from 'react'
import { Plus, Trash2, TrendingUp, Repeat, Wallet } from 'lucide-react'
import Modal from './Modal'
import SecureValue from './SecureValue'

function DividendesCard({ dividendes, totalDouzeMois, syntheseDouzeMois, valorisationTotale, positions, onAjouter, onSupprimer }) {
    const [modalOuvert, setModalOuvert] = useState(false)
    const [form, setForm] = useState({
        position_id: '',
        montant: '',
        date: new Date().toISOString().split('T')[0],
        reinvesti: false,
        type_compte: 'CTO',
    })

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const rendement = valorisationTotale > 0 ? (totalDouzeMois / valorisationTotale) * 100 : 0

    // Quand on sélectionne une position, on hérite automatiquement de son type de compte
    const handlePositionChange = (positionId) => {
        const pos = positions.find((p) => p.id === positionId)
        setForm((f) => ({
            ...f,
            position_id: positionId,
            type_compte: pos?.type_compte || f.type_compte,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await onAjouter({
            ...form,
            montant: parseFloat(form.montant),
            position_id: form.position_id || null,
        })
        if (!error) {
            setForm({ position_id: '', montant: '', date: new Date().toISOString().split('T')[0], reinvesti: false, type_compte: 'CTO' })
            setModalOuvert(false)
        }
    }

    const synth = syntheseDouzeMois || { totalBrut: 0, totalNet: 0, totalImpot: 0, totalReinvesti: 0, totalPercu: 0, parEnveloppe: { PEA: { brut: 0, net: 0 }, CTO: { brut: 0, net: 0 } } }
    const partReinvestie = synth.totalNet > 0 ? (synth.totalReinvesti / synth.totalNet) * 100 : 0

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-navy font-semibold">Dividendes</h3>
                <button onClick={() => setModalOuvert(true)} className="text-emerald hover:text-emerald-light flex items-center gap-1 text-sm font-medium">
                    <Plus size={16} /> Ajouter
                </button>
            </div>

            {/* KPIs principaux */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-gray-400 text-xs mb-1">Brut (12 mois)</p>
                    <p className="text-navy font-bold text-lg"><SecureValue value={synth.totalBrut} formatter={formatMontant} /></p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs mb-1">Net (12 mois)</p>
                    <p className="text-emerald font-bold text-lg"><SecureValue value={synth.totalNet} formatter={formatMontant} /></p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs mb-1">Impôt payé</p>
                    <p className="text-red-500 font-bold text-lg">-<SecureValue value={synth.totalImpot} formatter={formatMontant} /></p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs mb-1">Rendement (brut)</p>
                    <p className="text-navy font-bold text-lg"><SecureValue value={rendement} formatter={v => `${v.toFixed(2)} %`} /></p>
                </div>
            </div>

            {/* Réinvesti vs perçu */}
            {synth.totalNet > 0 && (
                <div className="bg-graylight rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1"><Repeat size={12} /> Réinvesti : <SecureValue value={synth.totalReinvesti} formatter={formatMontant} /></span>
                        <span className="flex items-center gap-1"><Wallet size={12} /> Perçu : <SecureValue value={synth.totalPercu} formatter={formatMontant} /></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald rounded-full transition-all" style={{ width: `${partReinvestie}%` }} />
                    </div>
                </div>
            )}

            {/* Ventilation par enveloppe */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-indigo-500 mb-1">PEA — franchise d'impôt</p>
                    <p className="text-sm text-navy font-medium"><SecureValue value={synth.parEnveloppe.PEA.brut} formatter={formatMontant} /></p>
                    <p className="text-xs text-gray-400">Capitalisé sans fiscalité tant que le plan n'est pas clôturé</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-500 mb-1">CTO — PFU 31,4 %</p>
                    <p className="text-sm text-navy font-medium"><SecureValue value={synth.parEnveloppe.CTO.net} formatter={formatMontant} /> <span className="text-xs text-gray-400">net</span></p>
                    <p className="text-xs text-gray-400">Brut : <SecureValue value={synth.parEnveloppe.CTO.brut} formatter={formatMontant} /></p>
                </div>
            </div>

            {dividendes.length > 0 && (
                <div className="border-t pt-3 space-y-1 max-h-48 overflow-y-auto">
                    {dividendes.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm py-1.5">
                            <div>
                                <span className="text-gray-500">
                                    {d.positions_financieres?.symbole || 'Global'} • {new Date(d.date).toLocaleDateString('fr-FR')}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${d.type_compte === 'PEA' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'}`}>
                                        {d.type_compte}
                                    </span>
                                    {d.reinvesti && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald/10 text-emerald flex items-center gap-0.5">
                                            <Repeat size={9} /> Réinvesti
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <span className="text-navy font-medium block"><SecureValue value={d.fiscal?.montantNet ?? d.montant} formatter={formatMontant} /></span>
                                    {d.fiscal?.impotTotal > 0 && (
                                        <span className="text-[10px] text-red-400">brut <SecureValue value={d.montant} formatter={formatMontant} /></span>
                                    )}
                                </div>
                                <button onClick={() => onSupprimer(d.id)} className="text-gray-300 hover:text-red-500">
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
                        onChange={(e) => handlePositionChange(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="">Dividende global (toutes positions)</option>
                        {positions.map((p) => (
                            <option key={p.id} value={p.id}>{p.symbole} ({p.type_compte})</option>
                        ))}
                    </select>

                    {!form.position_id && (
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">Enveloppe fiscale</label>
                            <select
                                value={form.type_compte}
                                onChange={(e) => setForm({ ...form, type_compte: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="CTO">CTO</option>
                                <option value="PEA">PEA</option>
                            </select>
                        </div>
                    )}

                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Montant brut reçu"
                        value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />

                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={form.reinvesti}
                            onChange={(e) => setForm({ ...form, reinvesti: e.target.checked })}
                        />
                        Ce dividende a été réinvesti (et non perçu en cash)
                    </label>

                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Ajouter
                    </button>
                </form>
            </Modal>
        </div>
    )
}

export default DividendesCard