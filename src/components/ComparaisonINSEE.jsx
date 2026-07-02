import { useState } from 'react'
import { PATRIMOINE_MEDIAN_FRANCE, getTrancheParAge } from '../lib/donneesInsee'
import { Users } from 'lucide-react'

function ComparaisonINSEE({ patrimoineTotal }) {
    const [age, setAge] = useState(30)
    const tranche = getTrancheParAge(age)

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)

    const ratio = tranche.median > 0 ? (patrimoineTotal / tranche.median) * 100 : 0
    const audessus = patrimoineTotal >= tranche.median

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-navy font-semibold mb-1 flex items-center gap-2">
                <Users size={18} className="text-emerald" />
                Comparaison avec les Français
            </h3>
            <p className="text-xs text-gray-400 mb-4">Basé sur le patrimoine net médian par âge (INSEE)</p>

            <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">Ton âge</label>
                <input
                    type="range"
                    min="18"
                    max="90"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-emerald"
                />
                <p className="text-center text-navy font-semibold mt-1">{age} ans</p>
            </div>

            <div className="bg-graylight rounded-lg p-4 mb-3">
                <p className="text-xs text-gray-400 mb-1">Médiane en France ({tranche.trancheAge})</p>
                <p className="text-navy font-bold text-lg">{formatMontant(tranche.median)}</p>
            </div>

            <p className={`text-sm font-medium ${audessus ? 'text-emerald' : 'text-gray-500'}`}>
                {audessus
                    ? `🎉 Ton patrimoine est ${ratio.toFixed(0)}% de la médiane, tu es au-dessus de la moyenne de ta tranche d'âge !`
                    : `Ton patrimoine représente ${ratio.toFixed(0)}% de la médiane de ta tranche d'âge.`}
            </p>

            <p className="text-xs text-gray-400 mt-3 italic">
                Données indicatives basées sur des statistiques publiques, à titre informatif uniquement.
            </p>
        </div>
    )
}

export default ComparaisonINSEE