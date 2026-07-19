import { RefreshCw, TrendingUp } from 'lucide-react'
import { useEstimationDividendes } from '../hooks/useEstimationDividendes'
import SecureValue from './SecureValue'

function EstimationDividendesPanel({ positions }) {
    const { positionsEstimees, totalAnnuel, loading, actualisation, actualiserEstimations } = useEstimationDividendes(positions)

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    if (loading) return null
    if (!positions || positions.length === 0) return null

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-navy font-semibold flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald" />
                    Revenu de dividendes estimé (basé sur tes positions)
                </h3>
                <button
                    onClick={actualiserEstimations}
                    disabled={actualisation}
                    className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-emerald disabled:opacity-50"
                >
                    <RefreshCw size={13} className={actualisation ? 'animate-spin' : ''} />
                    {actualisation ? 'Actualisation...' : 'Actualiser'}
                </button>
            </div>

            <p className="text-navy font-bold text-2xl mb-1">
                <SecureValue value={totalAnnuel} formatter={formatMontant} /> <span className="text-sm font-normal text-gray-400">/an estimé</span>
            </p>
            <p className="text-xs text-gray-400 mb-4">
                Soit environ <SecureValue value={totalAnnuel / 12} formatter={formatMontant} />/mois — calcul automatique à partir du dividende par action publié et de ta quantité détenue.
            </p>

            <div className="space-y-1.5">
                {positionsEstimees.map((p) => (
                    <div key={p.id || p.symbole} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-600">{p.symbole} <span className="text-gray-400">· {p.quantite} parts</span></span>
                        {p.connu ? (
                            <span className="font-medium text-navy">
                                <SecureValue value={p.estimationAnnuelle} formatter={formatMontant} />
                                <span className="text-gray-400 font-normal"> ({p.dividendePartAction.toFixed(2)} €/action)</span>
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">Dividende inconnu — clique "Actualiser"</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EstimationDividendesPanel