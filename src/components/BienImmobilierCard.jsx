import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Home, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react'
import { calculerRentabilite } from '../lib/calculImmo'
import { useDettes } from '../hooks/useDettes'
import SecureValue from './SecureValue'

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

    const { dettes } = useDettes()
    const detteLiee = dettes.find(d => d.bien_immobilier_id === bien.id)

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
        <div className="bg-card rounded-xl border border-[var(--border)] overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center border border-[var(--border)]">
                        <Home size={18} className="text-emerald" />
                    </div>
                    <div>
                        <p className="font-semibold text-[var(--text-h)]">{bien.nom}</p>
                        <p className="text-xs text-[var(--text)]">{bien.type_bien} • {bien.statut}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-[var(--text)]">Valeur nette</p>
                        <p className="font-bold text-[var(--text-h)]"><SecureValue value={valeurNette} formatter={fmt} /></p>
                        <p className="text-xs text-[var(--text)]">Valeur: <SecureValue value={bienSim.valeur_actuelle} formatter={fmt} /></p>
                    </div>
                    {estLocatif && (
                        <div className={`text-right ${cashFlowMensuel >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                            <p className="text-xs text-[var(--text)]">Cash-flow/mois</p>
                            <p className="font-bold flex items-center gap-1">
                                {cashFlowMensuel >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <SecureValue value={cashFlowMensuel} formatter={fmt} />
                            </p>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { setSimulateur(!simulateur); setDeplié(true) }}
                            title="Simulateur"
                            className={`p-1.5 rounded-lg transition ${simulateur ? 'bg-emerald text-white' : 'text-[var(--text)] hover:text-emerald'}`}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                        <button onClick={() => setDeplié(!deplié)} className="text-[var(--text)] hover:text-[var(--text-h)] p-1.5">
                            {deplié ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button onClick={() => onSupprimer(bien.id)} className="text-[var(--text-muted)] hover:text-[var(--negative)] p-1.5">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulateur live */}
            {simulateur && (
                <div className="border-t border-[var(--border)] bg-emerald/5 px-5 py-4">
                    <p className="text-xs font-semibold text-emerald mb-3 uppercase tracking-wide">
                        Simulateur — modifie les valeurs pour voir l'impact en temps réel
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {estLocatif && (
                            <div>
                                <label className="text-xs text-[var(--text)] mb-1 block">Loyer mensuel (€)</label>
                                <input
                                    type="number" value={simLoyer}
                                    onChange={(e) => setSimLoyer(parseFloat(e.target.value) || 0)}
                                    className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}
                        {bien.montant_credit > 0 && (
                            <div>
                                <label className="text-xs text-[var(--text)] mb-1 block">Taux crédit (%)</label>
                                <input
                                    type="number" step="0.01" value={simTaux}
                                    onChange={(e) => setSimTaux(parseFloat(e.target.value) || 0)}
                                    className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-[var(--text)] mb-1 block">Valeur actuelle (€)</label>
                            <input
                                type="number" value={simValeur}
                                onChange={(e) => setSimValeur(parseFloat(e.target.value) || 0)}
                                className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    {/* Résultats simulés en temps réel */}
                    <div className="grid grid-cols-4 gap-3 mt-4">
                        {estLocatif && (
                            <>
                                <div className="bg-card rounded-lg p-3 text-center border border-[var(--border)]">
                                    <p className="text-xs text-[var(--text)]">Rentabilité brute</p>
                                    <p className="font-bold text-[var(--text-h)] text-sm"><SecureValue value={rentabiliteBrute} formatter={fmtPct} /></p>
                                </div>
                                <div className="bg-card rounded-lg p-3 text-center border border-[var(--border)]">
                                    <p className="text-xs text-[var(--text)]">Rentabilité nette</p>
                                    <p className={`font-bold text-sm ${rentabiliteNette >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                        <SecureValue value={rentabiliteNette} formatter={fmtPct} />
                                    </p>
                                </div>
                                <div className="bg-card rounded-lg p-3 text-center border border-[var(--border)]">
                                    <p className="text-xs text-[var(--text)]">Cash-flow/mois</p>
                                    <p className={`font-bold text-sm ${cashFlowMensuel >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                        <SecureValue value={cashFlowMensuel} formatter={fmt} />
                                    </p>
                                </div>
                            </>
                        )}
                        <div className="bg-card rounded-lg p-3 text-center border border-[var(--border)]">
                            <p className="text-xs text-[var(--text)]">Valeur nette</p>
                            <p className="font-bold text-[var(--text-h)] text-sm"><SecureValue value={valeurNette} formatter={fmt} /></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Détails dépliables */}
            {deplié && (
                <div className="border-t border-[var(--border)] px-5 py-4 grid grid-cols-2 gap-6">
                    {/* Colonne gauche */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-[var(--text-h)] mb-2">Valeur &amp; Plus-value</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text)]">Prix d'achat</span>
                            <span className="font-medium text-[var(--text-h)]"><SecureValue value={bien.prix_achat} formatter={fmt} /></span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text)]">Valeur actuelle</span>
                            <span className="font-medium text-[var(--text-h)]"><SecureValue value={bienSim.valeur_actuelle} formatter={fmt} /></span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text)]">Plus-value latente</span>
                            <span className={`font-semibold ${plusValue >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                {plusValue >= 0 ? '+' : ''}<SecureValue value={plusValue} formatter={fmt} />
                            </span>
                        </div>

                        {/* On utilise les données de la dette si elle existe, sinon les données legacy du bien */}
                        {(detteLiee || bien.montant_credit > 0) && (
                            <>
                                <h4 className="text-sm font-semibold text-[var(--text-h)] mt-3 mb-2">Crédit {detteLiee ? '(Lié)' : '(Legacy)'}</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Montant emprunté</span>
                                    <span className="font-medium text-[var(--text-h)]"><SecureValue value={detteLiee ? detteLiee.capital_emprunte : bien.montant_credit} formatter={fmt} /></span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Taux</span>
                                    <span className="font-medium text-[var(--text-h)]">{detteLiee ? detteLiee.taux_interet : bien.taux_credit}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Mensualité</span>
                                    <span className="font-medium text-[var(--text-h)]"><SecureValue value={detteLiee ? detteLiee.mensualite : mensualiteCredit} formatter={fmt} />/mois</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Capital restant dû</span>
                                    <span className="font-semibold text-[var(--negative)]">−<SecureValue value={detteLiee ? detteLiee.crdActuel : capitalRestantDu} formatter={fmt} /></span>
                                </div>
                                {(detteLiee ? (detteLiee.progression > 0) : (moisEcoules > 0)) && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text)]">{detteLiee ? 'Progression' : 'Mois remboursés'}</span>
                                        <span className="font-medium text-[var(--text-h)]">{detteLiee ? fmtPct(detteLiee.progression) : `${moisEcoules} mois`}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2">
                                    <span className="text-[var(--text)] font-medium">Valeur nette</span>
                                    <span className="font-bold text-[var(--text-h)]"><SecureValue value={bienSim.valeur_actuelle - (detteLiee ? detteLiee.crdActuel : capitalRestantDu)} formatter={fmt} /></span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Colonne droite : cash-flow détaillé */}
                    {estLocatif ? (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[var(--text-h)] mb-2">Détail du cash-flow mensuel</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text)]">Loyer brut</span>
                                <span className="font-medium text-emerald">+<SecureValue value={bien.loyer_mensuel} formatter={fmt} /></span>
                            </div>
                            {bien.taux_vacance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Vacance locative ({bien.taux_vacance}%)</span>
                                    <span className="font-medium text-red-400">
                                        −<SecureValue value={bien.loyer_mensuel * (bien.taux_vacance / 100)} formatter={fmt} />
                                    </span>
                                </div>
                            )}
                            {mensualiteCredit > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Mensualité crédit</span>
                                    <span className="font-medium text-[var(--negative)]">−<SecureValue value={mensualiteCredit} formatter={fmt} /></span>
                                </div>
                            )}
                            {chargesAnnuelles > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Charges (ramené/mois)</span>
                                    <span className="font-medium text-[var(--negative)]">−<SecureValue value={chargesAnnuelles / 12} formatter={fmt} /></span>
                                </div>
                            )}
                            <div className="border-t border-[var(--border)] pt-2 space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-[var(--text)]">Cash-flow net/mois</span>
                                    <span className={cashFlowMensuel >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}>
                                        {cashFlowMensuel >= 0 ? '+' : ''}<SecureValue value={cashFlowMensuel} formatter={fmt} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Rentabilité brute</span>
                                    <span className="font-semibold text-[var(--text-h)]"><SecureValue value={rentabiliteBrute} formatter={fmtPct} /></span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text)]">Rentabilité nette</span>
                                    <span className={`font-semibold ${rentabiliteNette >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                        <SecureValue value={rentabiliteNette} formatter={fmtPct} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center text-[var(--text)] text-sm">
                            Résidence principale — pas de revenu locatif
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default BienImmobilierCard