import { Trash2 } from 'lucide-react'

function CompteCard({ compte, onSupprimer }) {
    const formatMontant = (montant, devise) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: devise || 'EUR',
        }).format(montant)
    }

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: compte.couleur }}
                />
                <div>
                    <p className="font-semibold text-navy">{compte.nom}</p>
                    <p className="text-xs text-gray-400">{compte.type}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <p className="font-bold text-navy">
                    {formatMontant(compte.solde, compte.devise)}
                </p>
                <button
                    onClick={() => onSupprimer(compte.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    )
}

export default CompteCard