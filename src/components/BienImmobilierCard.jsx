import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Home, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react'
import { calculerRentabilite } from '../lib/calculImmo'

function BienImmobilierCard({ bien, onSupprimer }) {
    const [deplié, setDeplié] = useState(false)
    const [simulateur, setSimulateur] = useState(false)
    // Valeurs simulées (overrides locaux, ne modifient pas la DB)
    const [simLoyer, setSimLoyer] = useState(bien.loyer_mensuel || 0)
    const [simTaux, setSimTaux] = useState(bien.taux_credit || 0)
    const [simValeur, setSimValeur] = useState(bien.valeur_actuelle || 0)

    const fmt = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)
    const fmtPct = (p) => `${p.toFixed(2)} %`

    // Calcul avec les valeurs simulées
    const bienSim = simulateur
        ? { ...bien, loyer_mensuel: simLoyer, taux_credit: simTaux, valeur_actuelle: simValeur }
        : bien

    const {
        mensualiteCredit,
        cashFlowMensuel,
        rentabiliteBrute,
        rentabiliteNette,
        plusValue,
        valeurNette,
        chargesAnnuelles,
        capitalRestantDu,
        moisEcoules,
    } = calculerRentabilite(bienSim)

    const estLocatif = bien.loyer_mensuel > 0

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
                        <Home size={18} className="text-emerald" />
                    </div>
                    <div>
                        <p className="font-semibold text-navy">{bien.nom}</p>
                        <p className="text-xs text-gray-400">{bien.type_bien} • {bien.statut}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Valeur nette</p>
                        <p className="font-bold text-navy">{fmt(valeurNette)}</p>
                        <p className="text-xs text-gray-400">Valeur: {fmt(bienSim.valeur_actuelle)}</p>
                    </div>
                    {estLocatif && (
                        <div className={`text-right ${cashFlowMensuel >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                            <p className="text-xs text-gray-400">Cash-flow/mois</p>
                            <p className="font-bold flex items-center gap-1">
                                {cashFlowMensuel >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {fmt(cashFlowMensuel)}
                            </p>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { setSimulateur(!simulateur); setDeplié(true) }}
                            title="Simulateur"
                            className={`p-1.5 rounded-lg transition ${simulateur ? 'bg-emerald text-white' : 'text-gray-400 hover:text-emerald'}`}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                        <button onClick={() => setDeplié(!deplié)} className="text-gray-400 hover:text-navy p-1.5">
                            {deplié ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button onClick={() => onSupprimer(bien.id)} className="text-gray-300 hover:text-red-500 p-1.5">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulateur live */}
            {simulateur && (
                <div className="border-t bg-emerald/5 px-5 py-4">
                    <p className="text-xs font-semibold text-emerald mb-3 uppercase tracking-wide">
                        Simulateur — modifie les valeurs pour voir l'impact en temps réel
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {estLocatif && (
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Loyer mensuel (€)</label>
                                <input
                                    type="number" value={simLoyer}
                                    onChange={(e) => setSimLoyer(parseFloat(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}
                        {bien.montant_credit > 0 && (
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Taux crédit (%)</label>
                                <input
                                    type="number" step="0.01" value={simTaux}
                                    onChange={(e) => setSimTaux(parseFloat(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Valeur actuelle (€)</label>
                            <input
                                type="number" value={simValeur}
                                onChange={(e) => setSimValeur(parseFloat(e.target.value) || 0)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    {/* Résultats simulés en temps réel */}
                    <div className="grid grid-cols-4 gap-3 mt-4">
                        {estLocatif && (
                            <>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-400">Rentabilité brute</p>
                                    <p className="font-bold text-navy text-sm">{fmtPct(rentabiliteBrute)}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-400">Rentabilité nette</p>
                                    <p className={`font-bold text-sm ${rentabiliteNette >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                        {fmtPct(rentabiliteNette)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-400">Cash-flow/mois</p>
                                    <p className={`font-bold text-sm ${cashFlowMensuel >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                        {fmt(cashFlowMensuel)}
                                    </p>
                                </div>
                            </>
                        )}
                        <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-400">Valeur nette</p>
                            <p className="font-bold text-navy text-sm">{fmt(valeurNette)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Détails dépliables */}
            {deplié && (
                <div className="border-t px-5 py-4 grid grid-cols-2 gap-6">
                    {/* Colonne gauche */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-navy mb-2">Valeur & Plus-value</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Prix d'achat</span>
                            <span className="font-medium text-navy">{fmt(bien.prix_achat)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Valeur actuelle</span>
                            <span className="font-medium text-navy">{fmt(bienSim.valeur_actuelle)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Plus-value latente</span>
                            <span className={`font-semibold ${plusValue >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                {plusValue >= 0 ? '+' : ''}{fmt(plusValue)}
                            </span>
                        </div>

                        {bien.montant_credit > 0 && (
                            <>
                                <h4 className="text-sm font-semibold text-navy mt-3 mb-2">Crédit</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Montant emprunté</span>
                                    <span className="font-medium text-navy">{fmt(bien.montant_credit)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Taux</span>
                                    <span className="font-medium text-navy">{bien.taux_credit}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mensualité</span>
                                    <span className="font-medium text-navy">{fmt(mensualiteCredit)}/mois</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Capital restant dû</span>
                                    <span className="font-semibold text-red-500">−{fmt(capitalRestantDu)}</span>
                                </div>
                                {moisEcoules > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Mois remboursés</span>
                                        <span className="font-medium text-navy">{moisEcoules} mois</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="text-gray-600 font-medium">Valeur nette</span>
                                    <span className="font-bold text-navy">{fmt(valeurNette)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Colonne droite : cash-flow détaillé */}
                    {estLocatif ? (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-navy mb-2">Détail du cash-flow mensuel</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Loyer brut</span>
                                <span className="font-medium text-emerald">+{fmt(bien.loyer_mensuel)}</span>
                            </div>
                            {bien.taux_vacance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Vacance locative ({bien.taux_vacance}%)</span>
                                    <span className="font-medium text-red-400">
                                        −{fmt(bien.loyer_mensuel * (bien.taux_vacance / 100))}
                                    </span>
                                </div>
                            )}
                            {mensualiteCredit > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mensualité crédit</span>
                                    <span className="font-medium text-red-500">−{fmt(mensualiteCredit)}</span>
                                </div>
                            )}
                            {chargesAnnuelles > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Charges (ramené/mois)</span>
                                    <span className="font-medium text-red-500">−{fmt(chargesAnnuelles / 12)}</span>
                                </div>
                            )}
                            <div className="border-t pt-2 space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-700">Cash-flow net/mois</span>
                                    <span className={cashFlowMensuel >= 0 ? 'text-emerald' : 'text-red-500'}>
                                        {cashFlowMensuel >= 0 ? '+' : ''}{fmt(cashFlowMensuel)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Rentabilité brute</span>
                                    <span className="font-semibold text-navy">{fmtPct(rentabiliteBrute)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Rentabilité nette</span>
                                    <span className={`font-semibold ${rentabiliteNette >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                        {fmtPct(rentabiliteNette)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-gray-400 text-sm">
                            Résidence principale — pas de revenu locatif
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default BienImmobilierCard