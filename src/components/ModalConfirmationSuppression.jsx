import { useState, useEffect } from 'react'
import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ModalConfirmationSuppression({ compte, soldeReel, hasHistorique, onClose, onCloturer, onSupprimerDefinitivement }) {
    const [confirmationTexte, setConfirmationTexte] = useState('')
    const [zoneDangereuseOuverte, setZoneDangereuseOuverte] = useState(false)

    useEffect(() => {
        setConfirmationTexte('')
        setZoneDangereuseOuverte(false)
    }, [compte])

    if (!compte) return null

    const risque = Math.abs(soldeReel) > 0.01 || hasHistorique
    const nomAttendu = compte.nom
    const confirmationValide = confirmationTexte.trim().toLowerCase() === nomAttendu.trim().toLowerCase()

    if (!risque) {
        // Compte vide, sans historique : suppression simple sans friction inutile
        return (
            <Modal isOpen={!!compte} onClose={onClose} title="Supprimer ce compte ?">
                <div className="space-y-4">
                    <p className="text-[var(--text)] text-sm">
                        "{compte.nom}" est vide et n'a aucun historique. La suppression est immédiate et définitive.
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 border border-[var(--border)] text-[var(--text)] font-semibold py-2 rounded-lg">
                            Annuler
                        </button>
                        <button onClick={() => onSupprimerDefinitivement(compte.id)} className="flex-1 bg-[var(--negative)] hover:opacity-90 text-white font-semibold py-2 rounded-lg transition">
                            Supprimer
                        </button>
                    </div>
                </div>
            </Modal>
        )
    }

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Que faire de "${compte.nom}" ?`}>
            <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text)]">
                        Ce compte {Math.abs(soldeReel) > 0.01 && <>a un solde de <strong>{soldeReel.toLocaleString('fr-FR', { style: 'currency', currency: compte.devise || 'EUR' })}</strong></>}
                        {Math.abs(soldeReel) > 0.01 && hasHistorique && ' et '}
                        {hasHistorique && <>a un historique d'intérêts perçus</>}.
                        Le supprimer effacera définitivement tout ça.
                    </p>
                </div>

                <div>
                    <p className="text-sm font-semibold text-[var(--text-h)] mb-1">Option recommandée : clôturer</p>
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                        Le compte disparaît de tes listes actives, mais tout son historique est conservé. Réversible à tout moment.
                    </p>
                    <button onClick={() => onCloturer(compte)} className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Clôturer le compte
                    </button>
                </div>

                <div className="border-t border-[var(--border)] pt-3">
                    <button onClick={() => setZoneDangereuseOuverte(!zoneDangereuseOuverte)} className="text-xs text-[var(--negative)] underline">
                        Je veux le supprimer définitivement à la place
                    </button>
                    {zoneDangereuseOuverte && (
                        <div className="mt-3 space-y-2">
                            <p className="text-xs text-[var(--text)]">
                                Tape <strong>{nomAttendu}</strong> pour confirmer la suppression irréversible.
                            </p>
                            <input
                                value={confirmationTexte}
                                onChange={(e) => setConfirmationTexte(e.target.value)}
                                placeholder={nomAttendu}
                                className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                onClick={() => onSupprimerDefinitivement(compte.id)}
                                disabled={!confirmationValide}
                                className="w-full bg-[var(--negative)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                            >
                                Supprimer définitivement
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}