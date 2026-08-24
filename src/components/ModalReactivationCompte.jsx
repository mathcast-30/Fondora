import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function ModalReactivationCompte({ compte, getTransfertClotureLie, onClose, onConfirmer }) {
    const [transfert, setTransfert] = useState(undefined) // undefined = chargement, null = aucun
    const [envoi, setEnvoi] = useState(false)

    useEffect(() => {
        if (!compte) { setTransfert(undefined); return }
        getTransfertClotureLie(compte.id).then(setTransfert)
    }, [compte, getTransfertClotureLie])

    if (!compte) return null

    const confirmer = async (annulerTransfert) => {
        setEnvoi(true)
        await onConfirmer(compte.id, annulerTransfert)
        setEnvoi(false)
    }

    const formatMontant = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: compte.devise || 'EUR' }).format(v)

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Réactiver "${compte.nom}" ?`}>
            <div className="space-y-4">
                {transfert === undefined ? (
                    <p className="text-sm text-[var(--text)]">Vérification...</p>
                ) : transfert === null ? (
                    <>
                        <p className="text-sm text-[var(--text)]">Ce compte redeviendra visible dans tes listes actives.</p>
                        <button onClick={() => confirmer(false)} disabled={envoi} className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                            {envoi ? 'Réactivation...' : 'Réactiver'}
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-[var(--text)]">
                            Ce compte avait été clôturé avec un transfert de <strong>{formatMontant(transfert.montant)}</strong>
                            {transfert.transaction_liee?.comptes?.nom && <> vers "{transfert.transaction_liee.comptes.nom}"</>}.
                        </p>
                        <div className="space-y-2">
                            <button onClick={() => confirmer(true)} disabled={envoi} className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                                {envoi ? '...' : "Annuler le transfert et réactiver (remet l'argent ici)"}
                            </button>
                            <button onClick={() => confirmer(false)} disabled={envoi} className="w-full border border-[var(--border)] text-[var(--text)] font-semibold py-2 rounded-lg text-sm">
                                {envoi ? '...' : 'Réactiver sans toucher au transfert'}
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                            La 2ème option laissera ce compte avec un solde ajusté (l'argent reste où il a été transféré).
                        </p>
                    </>
                )}
            </div>
        </Modal>
    )
}
