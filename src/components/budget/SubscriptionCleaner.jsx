import { useState } from 'react'
import { Shield, Plus, Trash2, X, Bell } from 'lucide-react'
import { useIncognito } from '../../context/IncognitoContext'

const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v)

const FREQUENCES = [
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'annuel', label: 'Annuel' },
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
]

export default function SubscriptionCleaner({
    abonnements = [],
    onAjouter,
    onPlanifierResiliation,
    onSupprimer,
    loading = false,
}) {
    const { incognito } = useIncognito()
    const [modalAjout, setModalAjout] = useState(false)
    const [form, setForm] = useState({
        nom_abonnement: '', montant: '', frequence: 'mensuel',
        date_prochain_prelevement: '', est_periode_essai: false, date_fin_essai: '',
    })
    const [saving, setSaving] = useState(false)

    const mask = (v) => (incognito ? '•••• €' : fmt(v))

    const aResilier = abonnements.filter(a => a.resiliation_planifiee)
    const economieMensuelle = aResilier.reduce((s, a) => {
        const m = Number(a.montant)
        if (a.frequence === 'annuel') return s + m / 12
        if (a.frequence === 'hebdomadaire') return s + m * 4.33
        return s + m
    }, 0)

    const totalMensuel = abonnements.reduce((s, a) => {
        const m = Number(a.montant)
        if (a.frequence === 'annuel') return s + m / 12
        if (a.frequence === 'hebdomadaire') return s + m * 4.33
        return s + m
    }, 0)

    const handleAjouter = async (e) => {
        e.preventDefault()
        setSaving(true)
        const payload = {
            nom_abonnement: form.nom_abonnement,
            montant: parseFloat(form.montant),
            frequence: form.frequence,
            date_prochain_prelevement: form.date_prochain_prelevement,
            est_periode_essai: form.est_periode_essai,
            date_fin_essai: form.date_fin_essai || null,
        }
        await onAjouter(payload)
        setForm({ nom_abonnement: '', montant: '', frequence: 'mensuel', date_prochain_prelevement: '', est_periode_essai: false, date_fin_essai: '' })
        setModalAjout(false)
        setSaving(false)
    }

    return (
        <div className="bg-card border border-[var(--border)] rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield size={15} className="text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text)]">
                        Nettoyeur d'abonnements
                    </span>
                </div>
                <button
                    onClick={() => setModalAjout(true)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                    <Plus size={13} /> Ajouter
                </button>
            </div>

            <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <p className="text-[10px] text-[var(--text)] uppercase mb-1">Total mensuel</p>
                    <p className="text-sm font-bold text-red-400">{mask(totalMensuel)}</p>
                </div>
                {economieMensuelle > 0 && (
                    <div className="flex-1 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                        <p className="text-[10px] text-emerald-400 uppercase mb-1">Économie prévue</p>
                        <p className="text-sm font-bold text-emerald-400">{mask(economieMensuelle)}</p>
                    </div>
                )}
            </div>

            {loading ? (
                <p className="text-xs text-[var(--text)] text-center py-4">Chargement…</p>
            ) : abonnements.length === 0 ? (
                <div className="text-center py-6 text-[var(--text)] text-xs">
                    <Shield size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    Aucun abonnement suivi.<br />
                    <button onClick={() => setModalAjout(true)} className="text-emerald-400 hover:underline mt-1">
                        + Ajouter votre premier abonnement
                    </button>
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto max-h-52">
                    {abonnements.map((ab) => (
                        <div
                            key={ab.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                ${ab.resiliation_planifiee ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-[var(--bg)]'}`}
                        >
                            <input
                                type="checkbox"
                                checked={ab.resiliation_planifiee}
                                onChange={(e) => onPlanifierResiliation(ab.id, e.target.checked)}
                                className="accent-red-400 w-3.5 h-3.5 shrink-0 cursor-pointer"
                                title="Planifier la résiliation"
                            />

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${ab.resiliation_planifiee ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-h)]'}`}>
                                    {ab.nom_abonnement}
                                    {ab.est_periode_essai && (
                                        <span className="ml-2 text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold">ESSAI</span>
                                    )}
                                </p>
                                <p className="text-[10px] text-[var(--text)] mt-0.5">
                                    {FREQUENCES.find(f => f.value === ab.frequence)?.label || ab.frequence}
                                    {ab.date_fin_essai && ` · Fin essai : ${new Date(ab.date_fin_essai).toLocaleDateString('fr-FR')}`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-sm font-bold ${ab.resiliation_planifiee ? 'text-[var(--text-muted)]' : 'text-red-400'}`}>
                                    {mask(ab.montant)}
                                </span>
                                <button onClick={() => onSupprimer(ab.id)} className="text-[var(--text-muted)] hover:text-red-400 transition">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {economieMensuelle > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-emerald-400 flex items-center gap-1.5">
                    <Bell size={11} />
                    En résiliant les abonnements cochés, vous économiserez {mask(economieMensuelle)}/mois soit{' '}
                    <strong>{mask(economieMensuelle * 12)}/an</strong>.
                </div>
            )}

            {modalAjout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[var(--text-h)] font-bold">Nouvel abonnement</h3>
                            <button onClick={() => setModalAjout(false)} className="text-[var(--text-muted)] hover:text-[var(--text-h)]">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAjouter} className="space-y-3">
                            <input
                                type="text" required placeholder="Nom (ex: Netflix)"
                                value={form.nom_abonnement}
                                onChange={e => setForm({ ...form, nom_abonnement: e.target.value })}
                                className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm placeholder-[var(--text-muted)]"
                            />

                            <div className="flex gap-2">
                                <input
                                    type="number" required step="0.01" min="0" placeholder="Montant €"
                                    value={form.montant}
                                    onChange={e => setForm({ ...form, montant: e.target.value })}
                                    className="flex-1 border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                />
                                <select
                                    value={form.frequence}
                                    onChange={e => setForm({ ...form, frequence: e.target.value })}
                                    className="flex-1 border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                >
                                    {FREQUENCES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-[var(--text)] block mb-1">Prochain prélèvement</label>
                                <input
                                    type="date" required
                                    value={form.date_prochain_prelevement}
                                    onChange={e => setForm({ ...form, date_prochain_prelevement: e.target.value })}
                                    className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.est_periode_essai}
                                    onChange={e => setForm({ ...form, est_periode_essai: e.target.checked })}
                                    className="accent-amber-400"
                                />
                                Période d'essai gratuite
                            </label>

                            {form.est_periode_essai && (
                                <div>
                                    <label className="text-xs text-[var(--text)] block mb-1">Fin de la période d'essai</label>
                                    <input
                                        type="date"
                                        value={form.date_fin_essai}
                                        onChange={e => setForm({ ...form, date_fin_essai: e.target.value })}
                                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-emerald hover:bg-emerald-light disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition text-sm"
                            >
                                {saving ? 'Enregistrement…' : "Ajouter l'abonnement"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}