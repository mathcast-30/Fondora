import Modal from './Modal'
import SecureValue from './SecureValue'
import { useInteretsLivret } from '../hooks/useInteretsLivret'

export default function ModalHistoriqueInterets({ compte, onClose }) {
    const { historique, totalPercu, loading } = useInteretsLivret(compte?.id)

    const formatMontant = (montant) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: compte?.devise || 'EUR' }).format(montant)

    return (
        <Modal isOpen={!!compte} onClose={onClose} title={`Intérêts perçus — ${compte?.nom || ''}`}>
            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : historique.length === 0 ? (
                <p className="text-[var(--text)] text-sm">
                    Aucun intérêt versé pour l'instant. Les intérêts sont calculés automatiquement chaque 31 décembre.
                </p>
            ) : (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-emerald/10 rounded-lg px-3 py-2">
                        <span className="text-sm text-[var(--text)]">Total perçu depuis l'ouverture</span>
                        <span className="font-bold text-emerald">
                            <SecureValue value={totalPercu} formatter={formatMontant} />
                        </span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {historique.map((h) => (
                            <div key={h.id} className="flex justify-between items-center py-2.5">
                                <div>
                                    <p className="font-medium text-[var(--text-h)]">{h.annee}</p>
                                    {h.taux_moyen_pondere != null && (
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Taux moyen pondéré : {Number(h.taux_moyen_pondere).toFixed(3)} %
                                        </p>
                                    )}
                                </div>
                                <p className="font-semibold text-[var(--text-h)]">
                                    <SecureValue value={Number(h.montant_interets)} formatter={formatMontant} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    )
}