import { Trash2 } from 'lucide-react'
import SecureValue from './SecureValue'

function CompteCard({ compte, onSupprimer }) {
    const formatMontant = (montant, devise) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: devise || 'EUR',
        }).format(montant)
    }

    return (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: compte.couleur }}
                />
                <div>
                    <p className="font-semibold text-[var(--text-h)]">{compte.nom}</p>
                    <p className="text-xs text-[var(--text)]">{compte.type}</p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-4">
                    <p className="font-bold text-[var(--text-h)]">
                        <SecureValue value={compte.soldeReel ?? compte.solde} formatter={v => formatMontant(v, compte.devise)} />
                    </p>
                    <button
                        onClick={() => onSupprimer(compte.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--negative)] transition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                {compte.soldeReel !== undefined && Number(compte.soldeReel) !== Number(compte.solde) && (
                    <p className="text-xs text-[var(--text)]">
                        Initial : <SecureValue value={compte.solde} formatter={v => formatMontant(v, compte.devise)} /> | 
                        +<SecureValue value={compte.totalRevenus} formatter={v => formatMontant(v, compte.devise)} /> / 
                        -<SecureValue value={compte.totalDepenses} formatter={v => formatMontant(v, compte.devise)} />
                    </p>
                )}
            </div>
        </div>
    )
}

export default CompteCard