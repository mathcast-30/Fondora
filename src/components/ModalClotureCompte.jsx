import { useState } from 'react'
import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ModalClotureCompte({ compte, comptesDisponibles, onClose, onConfirmer }) {
    const [destination, setDestination] = useState('')
    const [envoi, setEnvoi] = useState(false)

    if (!compte) return null

    const solde = Number(compte.soldeReel ?? compte.solde)
    const soldeNonNul = Math.abs(solde) > 0.01
    const formatMontant = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: compte.devise || 'EUR' }).format(v)

    const confirmer = async (destinationId) => {
        setEnvoi(true)
        await onConfirmer(compte, destinationId)
        setEnvoi(false)
    }

    if (!soldeNonNul) {
        return (
            <Modal isOpen={!!compte} onClose={onClose} title={`Clôturer "${compte.nom}" ?`}>
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text)]">Ce compte est déjà à 0 €, rien à transférer. Il sera masqué mais son historique reste consultable.</p>
                    <button onClick={() => confirmer(null)} disabled={envoi} className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                        {envoi ? 'Clôture...' : 'Confirmer la clôture'}
                    </button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Clôturer "${compte.nom}"`}>
            <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text)]">
                        Ce compte a encore <strong>{formatMontant(solde)}</strong> dessus. Où part cet argent ?
                    </p>
                </div>

                {comptesDisponibles.length > 0 && (
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Virer vers un autre compte</label>
                        <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm">
                            <option value="">Choisir un compte...</option>
                            {comptesDisponibles.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom} ({formatMontant(c.soldeReel ?? c.solde)})</option>
                            ))}
                        </select>
                        <button
                            onClick={() => confirmer(destination)}
                            disabled={!destination || envoi}
                            className="w-full bg-emerald hover:bg-emerald-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition mt-2"
                        >
                            {envoi ? 'Transfert...' : 'Transférer et clôturer'}
                        </button>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Ton patrimoine total ne change pas, l'argent est juste déplacé.</p>
                    </div>
                )}

                <div className="border-t border-[var(--border)] pt-3">
                    <button onClick={() => confirmer(null)} disabled={envoi} className="w-full border border-[var(--border)] text-[var(--text)] font-semibold py-2 rounded-lg text-sm">
                        {envoi ? 'Clôture...' : 'Argent retiré / dépensé hors app'}
                    </button>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        Ton patrimoine total baissera de {formatMontant(solde)} dans Fondora (retrait cash, dépense non suivie...).
                    </p>
                </div>
            </div>
        </Modal>
    )
}