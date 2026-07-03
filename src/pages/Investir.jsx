import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import EvolutionPatrimoineChart from '../components/EvolutionPatrimoineChart'
import DonutChart from '../components/DonutChart'
import LegendeAllocation from '../components/LegendeAllocation'
import DividendesCard from '../components/DividendesCard'
import SimulateurAchatCrypto from '../components/SimulateurAchatCrypto'
import TopCryptoTable from '../components/TopCryptoTable'
import BienImmobilierCard from '../components/BienImmobilierCard'
import FormBienImmobilier from '../components/FormBienImmobilier'
import CryptoPortfolioChart from '../components/CryptoPortfolioChart'
import DiversificationScore from '../components/DiversificationScore'
import TransactionForm from '../components/TransactionForm'
import CryptoTransactionForm from '../components/CryptoTransactionForm'
import { PnLLatentDisplay } from '../components/PnLLatentToggle'
import { usePositions } from '../hooks/usePositions'
import { useCoursBourse } from '../hooks/useCoursBourse'
import { useHistoriquePatrimoine } from '../hooks/useHistoriquePatrimoine'
import { useDividendes } from '../hooks/useDividendes'
import { usePositionsCrypto } from '../hooks/usePositionsCrypto'
import { useCoursCrypto } from '../hooks/useCoursCrypto'
import { useTopCrypto } from '../hooks/useTopCrypto'
import { useBiensImmobiliers } from '../hooks/useBiensImmobiliers'
import { useAuth } from '../context/AuthContext'
import { calculerRentabilite } from '../lib/calculImmo'
import { calculateDiversificationScore, calculateXIRR, calculateCryptoRealizedPL, calculatePRU } from '../lib/financialCalculations'
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator, BarChart3, History, PlusCircle, MinusCircle } from 'lucide-react'

function Investir() {
    const [ongletActif, setOngletActif] = useState('actions')
    const { user } = useAuth()

    // ============================================
    // ACTIONS & ETF STATE
    // ============================================
    const { 
        positions, 
        transactions, 
        loading: loadingPositions,
        ajouterPosition, 
        supprimerPosition,
        ajouterTransaction,
        displayMode,
        toggleDisplayMode,
        calculerPnLRealise
    } = usePositions()
    
    const symboles = positions.map((p) => p.symbole)
    const { cours, loading: loadingCours } = useCoursBourse(symboles)
    const [modalOuvert, setModalOuvert] = useState(false)
    const [modalTransactionOuvert, setModalTransactionOuvert] = useState(false)
    const [transactionType, setTransactionType] = useState('buy')
    const [form, setForm] = useState({
        symbole: '', quantite: '', prix_achat_moyen: '', devise: 'EUR', type_compte: 'PEA',
    })

    const formatMontant = (m, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(m)

    const handleSubmitPosition = async (e) => {
        e.preventDefault()
        if (!form.symbole || !form.quantite || !form.prix_achat_moyen) return
        
        const { error } = await ajouterPosition({
            ...form,
            symbole: form.symbole.toUpperCase(),
            quantite: parseFloat(form.quantite),
            prix_achat_moyen: parseFloat(form.prix_achat_moyen),
        })
        if (!error) {
            setForm({ symbole: '', quantite: '', prix_achat_moyen: '', devise: 'EUR', type_compte: 'PEA' })
            setModalOuvert(false)
        }
    }

    const handleSubmitTransaction = async (transactionData) => {
        if (!transactionData.symbole || !transactionData.quantite || !transactionData.prix) return
        
        const { error } = await ajouterTransaction(transactionData)
        if (!error) {
            setModalTransactionOuvert(false)
        }
    }

    // Calculate portfolio metrics for Actions/ETF
    const valorisationTotale = positions.reduce((acc, p) => {
        const coursActuel = cours[p.symbole]?.coursActuel || p.prix_achat_moyen
        return acc + coursActuel * p.quantite
    }, 0)
    const investissementTotal = positions.reduce((acc, p) => acc + p.prix_achat_moyen * p.quantite, 0)
    const plusMoinsValueTotale = valorisationTotale - investissementTotal

    // Calculate XIRR/TRI for the entire portfolio
    const pnlRealise = calculerPnLRealise()
    const cashFlows = useMemo(() => {
        return transactions.map(t => ({
            date: t.date,
            amount: t.type === 'buy' ? -t.quantity * t.price : t.quantity * t.price
        }))
    }, [transactions])
    const xirrPortfolio = useMemo(() => calculateXIRR(cashFlows), [cashFlows])

    // Diversification score data
    const dataAllocation = positions.map((p) => ({
        nom: cours[p.symbole]?.nom || p.symbole,
        montant: (cours[p.symbole]?.coursActuel || p.prix_achat_moyen) * p.quantite,
        secteur: cours[p.symbole]?.secteur || 'inconnu',
        type: p.type_compte
    }))
    const diversificationScore = useMemo(() => {
        return calculateDiversificationScore(dataAllocation, valorisationTotale)
    }, [dataAllocation, valorisationTotale])

    const { historique, periode, setPeriode } = useHistoriquePatrimoine(valorisationTotale)
    const { dividendes, totalDouzeMois, ajouterDividende, supprimerDividende } = useDividendes()

    // ============================================
    // CRYPTO STATE
    // ============================================
    const { 
        positions: positionsCrypto, 
        loading: loadingCrypto, 
        ajouterPosition: ajouterCrypto, 
        supprimerPosition: supprimerCrypto,
        ajouterTransaction: ajouterTransactionCrypto,
        supprimerTransaction: supprimerTransactionCrypto,
        historicalData: historiqueCrypto,
        timeFilter: periodeCrypto,
        setPeriode: setPeriodeCrypto,
        sauvegarderValeurHistorique
    } = usePositionsCrypto()
    
    const coinIds = positionsCrypto.map((p) => p.coin_id)
    const { cours: coursCrypto, loading: loadingCoursCrypto } = useCoursCrypto(coinIds)
    const { topCrypto, loading: loadingTopCrypto } = useTopCrypto(10)
    
    const valorisationCrypto = positionsCrypto.reduce((acc, p) => 
        acc + (coursCrypto[p.coin_id]?.eur || p.prix_achat_moyen) * p.quantite, 0)
    const investiCrypto = positionsCrypto.reduce((acc, p) => acc + p.prix_achat_moyen * p.quantite, 0)
    const plusMoinsValueCrypto = valorisationCrypto - investiCrypto

    // Crypto P&L with PRU method
    const cryptoPnL = useMemo(() => {
        const cryptoTransactions = positionsCrypto.map(p => ({
            date: p.created_at || new Date().toISOString(),
            quantity: p.quantite,
            price: p.prix_achat_moyen,
            type: 'buy'
        }))
        return calculateCryptoRealizedPL(cryptoTransactions)
    }, [positionsCrypto])

    const currentPRU = useMemo(() => calculatePRU(positionsCrypto), [positionsCrypto])

    // Save crypto portfolio value to history
    useEffect(() => {
        if (valorisationCrypto > 0 && user) {
            sauvegarderValeurHistorique(valorisationCrypto)
        }
    }, [valorisationCrypto, sauvegarderValeurHistorique, user])

    // ============================================
    // IMMOBILIER STATE
    // ============================================
    const { biens, loading: loadingImmo, ajouterBien, supprimerBien, valeurTotaleImmo } = useBiensImmobiliers()
    const [modalImmoOuvert, setModalImmoOuvert] = useState(false)
    const [modalCryptoTransactionOuvert, setModalCryptoTransactionOuvert] = useState(false)
    const [cryptoTransactionType, setCryptoTransactionType] = useState('buy')

    const cashFlowTotal = biens.reduce((acc, b) => {
        const { cashFlowMensuel } = calculerRentabilite(b)
        return acc + cashFlowMensuel
    }, 0)

    const handleAjouterBien = async (donnees) => {
        const { error } = await ajouterBien(donnees)
        if (!error) setModalImmoOuvert(false)
    }

    const handleSubmitCryptoTransaction = async (transactionData) => {
        if (!transactionData.coin_id || !transactionData.quantite || !transactionData.prix) return
        
        const { error } = await ajouterTransactionCrypto(transactionData)
        if (!error) {
            setModalCryptoTransactionOuvert(false)
        }
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <Layout>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-navy text-3xl font-bold mb-1">Investir</h1>
                    <p className="text-gray-500">Tes investissements en actions, ETF, crypto et immobilier.</p>
                </div>
                <div className="flex gap-2">
                    {ongletActif === 'actions' && (
                        <>
                            <button 
                                onClick={() => setModalOuvert(true)} 
                                className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <Plus size={18} /> Position
                            </button>
                            {positions.length > 0 && (
                                <>
                                    <button 
                                        onClick={() => {
                                            setTransactionType('buy')
                                            setModalTransactionOuvert(true)
                                        }} 
                                        className="bg-navy hover:bg-navy-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                    >
                                        <PlusCircle size={18} /> Achat
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTransactionType('sell')
                                            setModalTransactionOuvert(true)
                                        }} 
                                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                    >
                                        <MinusCircle size={18} /> Vente
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    {ongletActif === 'crypto' && (
                        <>
                            <button 
                                onClick={() => {
                                    setCryptoTransactionType('buy')
                                    setModalCryptoTransactionOuvert(true)
                                }} 
                                className="bg-navy hover:bg-navy-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                            >
                                <PlusCircle size={18} /> Achat Crypto
                            </button>
                            {positionsCrypto.length > 0 && (
                                <button 
                                    onClick={() => {
                                        setCryptoTransactionType('sell')
                                        setModalCryptoTransactionOuvert(true)
                                    }} 
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                                >
                                    <MinusCircle size={18} /> Vente Crypto
                                </button>
                            )}
                        </>
                    )}
                    {ongletActif === 'immobilier' && (
                        <button onClick={() => setModalImmoOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                            <Plus size={18} /> Ajouter un bien
                        </button>
                    )}
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm w-fit">
                {[['actions', 'Actions & ETF'], ['crypto', 'Crypto'], ['immobilier', 'Immobilier']].map(([val, label]) => (
                    <button key={val} onClick={() => setOngletActif(val)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${ongletActif === val ? 'bg-navy text-white' : 'text-gray-500'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ============================================
                 ONGLET ACTIONS & ETF
                 ============================================ */}
            {ongletActif === 'actions' && (
                <div className="space-y-6">
                    {/* Portfolio Evolution Chart */}
                    {!loadingPositions && !loadingCours && positions.length > 0 && (
                        <EvolutionPatrimoineChart historique={historique} periode={periode} setPeriode={setPeriode} />
                    )}

                    {/* Portfolio Metrics */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1">Valorisation totale</p>
                            <p className="text-navy text-2xl font-bold">{formatMontant(valorisationTotale)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1">Investi</p>
                            <p className="text-navy text-2xl font-bold">{formatMontant(investissementTotal)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1">Plus/moins-value latent</p>
                            <PnLLatentDisplay
                                euroValue={plusMoinsValueTotale}
                                percentageValue={investissementTotal > 0 ? (plusMoinsValueTotale / investissementTotal) * 100 : 0}
                                mode={displayMode}
                                onToggle={toggleDisplayMode}
                            />
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                                <Calculator size={14} /> TRI (XIRR)
                            </p>
                            <p className="text-navy text-2xl font-bold">
                                {xirrPortfolio !== null ? (xirrPortfolio * 100).toFixed(2) + '%' : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Diversification Score */}
                    {positions.length > 0 && !loadingPositions && (
                        <DiversificationScore positions={dataAllocation} total={valorisationTotale} />
                    )}

                    {/* Realized P&L Section */}
                    {pnlRealise && pnlRealise.realizedPL !== 0 && (
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-emerald" />
                                <h3 className="text-navy font-semibold">P&L Réalisé (FIFO/PEPS)</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Plus-value réalisée</p>
                                    <p className={`text-xl font-bold ${pnlRealise.realizedPL >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                        {formatMontant(pnlRealise.realizedPL)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Coût total</p>
                                    <p className="text-navy text-xl font-bold">{formatMontant(pnlRealise.totalCost)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Produit des ventes</p>
                                    <p className="text-navy text-xl font-bold">{formatMontant(pnlRealise.totalProceeds)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    {transactions.length > 0 && (
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <History size={18} className="text-emerald" />
                                    <h3 className="text-navy font-semibold">Historique des transactions</h3>
                                </div>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {transactions
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map((t, index) => {
                                        const isBuy = t.type === 'buy'
                                        return (
                                            <div key={t.id || index} className="flex items-center justify-between p-3 bg-graylight rounded-lg">
                                                <div>
                                                    <p className="font-medium text-navy">{t.symbole}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(t.date).toLocaleDateString('fr-FR')} • {t.type === 'buy' ? 'Achat' : 'Vente'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-medium ${isBuy ? 'text-red-500' : 'text-emerald'}`}>
                                                        {isBuy ? '-' : '+'}{formatMontant(t.quantity * t.price)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{t.quantity} × {formatMontant(t.price)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Positions List */}
                    {loadingPositions ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                            Chargement des positions...
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                            Aucune position. Clique sur "Position" ou "Achat" pour commencer.
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-6">
                            <div className="col-span-2 space-y-6">
                                <div className="bg-white rounded-xl p-5 shadow-sm">
                                    <h3 className="text-navy font-semibold mb-4">Allocation</h3>
                                    <DonutChart data={dataAllocation} total={valorisationTotale} libelleCentre="Portefeuille" />
                                    <div className="mt-4">
                                        <LegendeAllocation data={dataAllocation} total={valorisationTotale} />
                                    </div>
                                </div>
                                {positions.length > 0 && (
                                    <DividendesCard
                                        dividendes={dividendes}
                                        totalDouzeMois={totalDouzeMois}
                                        valorisationTotale={valorisationTotale}
                                        positions={positions}
                                        onAjouter={ajouterDividende}
                                        onSupprimer={supprimerDividende}
                                    />
                                )}
                            </div>
                            
                            <div className="col-span-3">
                                <div className="bg-white rounded-xl shadow-sm divide-y">
                                    {positions.map((p) => {
                                        const infosCours = cours[p.symbole]
                                        const coursActuel = infosCours?.coursActuel || p.prix_achat_moyen
                                        const valeurActuelle = coursActuel * p.quantite
                                        const valeurInvestie = p.prix_achat_moyen * p.quantite
                                        const plusMoinsValue = valeurActuelle - valeurInvestie
                                        const pourcentage = valeurInvestie > 0 ? (plusMoinsValue / valeurInvestie) * 100 : 0
                                        
                                        // Calculate XIRR for this position
                                        const positionTransactions = transactions.filter(t => t.symbole?.toUpperCase() === p.symbole?.toUpperCase())
                                        const positionCashFlows = positionTransactions.map(t => ({
                                            date: t.date,
                                            amount: t.type === 'buy' ? -t.quantity * t.price : t.quantity * t.price
                                        }))
                                        const xirr = calculateXIRR(positionCashFlows)
                                        
                                        return (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {infosCours?.logo ? (
                                                        <img src={infosCours.logo} alt={p.symbole} className="w-9 h-9 rounded-full object-contain bg-gray-50 p-1" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400">
                                                            {p.symbole.slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-navy">{infosCours?.nom || p.symbole}</p>
                                                        <p className="text-xs text-gray-400">{p.symbole} • {p.quantite} parts • {p.type_compte}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Cours</p>
                                                        <p className="font-medium text-navy text-sm">{formatMontant(coursActuel, p.devise)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Valeur</p>
                                                        <p className="font-semibold text-navy text-sm">{formatMontant(valeurActuelle, p.devise)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">TRI (XIRR)</p>
                                                        <p className="text-xs font-medium text-navy">
                                                            {xirr !== null ? (xirr * 100).toFixed(1) + '%' : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right w-16">
                                                        <p className={`font-semibold text-sm ${plusMoinsValue >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                                            {plusMoinsValue >= 0 ? '+' : ''}{displayMode === 'euro' ? formatMontant(plusMoinsValue) : pourcentage.toFixed(1) + '%'}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => supprimerPosition(p.id)} className="text-gray-300 hover:text-red-500 transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================
                 ONGLET CRYPTO
                 ============================================ */}
            {ongletActif === 'crypto' && (
                <div className="space-y-6">
                    {/* Crypto Portfolio Chart - PLACED AT THE TOP */}
                    <CryptoPortfolioChart 
                        data={historiqueCrypto} 
                        periode={periodeCrypto} 
                        setPeriode={setPeriodeCrypto} 
                    />

                    {/* Crypto Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-gray-400 text-xs mb-1">Valorisation</p>
                            <p className="text-navy font-bold text-lg">{formatMontant(valorisationCrypto)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-gray-400 text-xs mb-1">Investi</p>
                            <p className="text-navy font-bold text-lg">{formatMontant(investiCrypto)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-gray-400 text-xs mb-1">Plus/moins-value</p>
                            <p className={`font-bold text-lg ${plusMoinsValueCrypto >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                {formatMontant(plusMoinsValueCrypto)}
                            </p>
                        </div>
                    </div>

                    {/* PRU Information */}
                    {positionsCrypto.length > 0 && (
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator size={18} className="text-emerald" />
                                <h3 className="text-navy font-semibold">P&L Réalisé Crypto (PRU - Méthode fiscale française)</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">PRU Actuel</p>
                                    <p className="text-navy text-xl font-bold">{formatMontant(currentPRU)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Plus-value réalisée</p>
                                    <p className={`text-xl font-bold ${cryptoPnL.realizedPL >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                        {formatMontant(cryptoPnL.realizedPL)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Total investi</p>
                                    <p className="text-navy text-xl font-bold">{formatMontant(cryptoPnL.totalCost)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                *Calcul selon l'Article 150 VH bis du CGI (PRU pondéré)
                            </p>
                        </div>
                    )}

                    {/* Crypto Positions and Simulator */}
                    <div className="grid grid-cols-5 gap-6">
                        <div className="col-span-2">
                            <SimulateurAchatCrypto onAjouter={ajouterCrypto} />
                        </div>
                        <div className="col-span-3">
                            {loadingCrypto ? (
                                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                                    Chargement des positions crypto...
                                </div>
                            ) : positionsCrypto.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                                    Aucune position crypto. Utilise le simulateur à gauche ou ajoute une transaction.
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm divide-y">
                                    {positionsCrypto.map((p) => {
                                        const prixActuel = coursCrypto[p.coin_id]?.eur || p.prix_achat_moyen
                                        const variation24h = coursCrypto[p.coin_id]?.eur_24h_change || 0
                                        const valeurActuelle = prixActuel * p.quantite
                                        const valeurInvestie = p.prix_achat_moyen * p.quantite
                                        const plusMoinsValue = valeurActuelle - valeurInvestie
                                        const pourcentage = valeurInvestie > 0 ? (plusMoinsValue / valeurInvestie) * 100 : 0
                                        return (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-4">
                                                <div>
                                                    <p className="font-semibold text-navy">{p.nom}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {p.symbole} • {p.quantite.toFixed(6)} unités
                                                        {loadingCoursCrypto && ' • Chargement...'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Cours</p>
                                                        <p className="font-medium text-navy text-sm">{formatMontant(prixActuel)}</p>
                                                        <p className={`text-xs ${variation24h >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                                            {variation24h >= 0 ? '+' : ''}{variation24h.toFixed(1)}% (24h)
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Valeur</p>
                                                        <p className="font-semibold text-navy text-sm">{formatMontant(valeurActuelle)}</p>
                                                    </div>
                                                    <div className="text-right w-16">
                                                        <p className={`font-semibold text-sm ${plusMoinsValue >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                                            {plusMoinsValue >= 0 ? '+' : ''}{pourcentage.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                    <button onClick={() => supprimerCrypto(p.id)} className="text-gray-300 hover:text-red-500 transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Crypto Table */}
                    <div>
                        <h3 className="text-navy font-semibold mb-3">Top 10 cryptos (capitalisation mondiale)</h3>
                        <TopCryptoTable data={topCrypto} loading={loadingTopCrypto} />
                    </div>
                </div>
            )}

            {/* ============================================
                 ONGLET IMMOBILIER
                 ============================================ */}
            {ongletActif === 'immobilier' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-navy rounded-xl p-5">
                            <p className="text-gray-300 text-sm mb-1">Valeur totale patrimoine immo</p>
                            <p className="text-white text-2xl font-bold">{formatMontant(valeurTotaleImmo)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1">Nombre de biens</p>
                            <p className="text-navy text-2xl font-bold">{biens.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm">
                            <p className="text-gray-400 text-sm mb-1">Cash-flow total mensuel</p>
                            <p className={`text-2xl font-bold ${cashFlowTotal >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                                {formatMontant(cashFlowTotal)}/mois
                            </p>
                        </div>
                    </div>

                    {loadingImmo ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                            Chargement des biens immobiliers...
                        </div>
                    ) : biens.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                            Aucun bien immobilier. Clique sur "Ajouter un bien" pour commencer.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {biens.map((bien) => (
                                <BienImmobilierCard key={bien.id} bien={bien} onSupprimer={supprimerBien} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================
                 MODALS
                 ============================================ */}

            {/* Modal ajout position actions */}
            <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouvelle position">
                <form onSubmit={handleSubmitPosition} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">Symbole boursier</label>
                        <input type="text" required value={form.symbole}
                            onChange={(e) => setForm({ ...form, symbole: e.target.value })}
                            placeholder="Ex: AAPL, MC.PA, VWCE.DE" className="w-full border rounded-lg px-3 py-2" />
                        <p className="text-xs text-gray-400 mt-1">Trouve le bon symbole sur Yahoo Finance ou Google Finance</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Quantité</label>
                            <input type="number" step="0.0001" required value={form.quantite}
                                onChange={(e) => setForm({ ...form, quantite: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Prix d'achat moyen</label>
                            <input type="number" step="0.01" required value={form.prix_achat_moyen}
                                onChange={(e) => setForm({ ...form, prix_achat_moyen: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Devise</label>
                            <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Type de compte</label>
                            <select value={form.type_compte} onChange={(e) => setForm({ ...form, type_compte: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                <option value="PEA">PEA</option>
                                <option value="CTO">CTO</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Ajouter la position
                    </button>
                </form>
            </Modal>

            {/* Modal ajout transaction actions */}
            <Modal 
                isOpen={modalTransactionOuvert} 
                onClose={() => setModalTransactionOuvert(false)} 
                title={`${transactionType === 'buy' ? 'Achat' : 'Vente'} d'actions/ETF`}
            >
                <TransactionForm
                    type={transactionType}
                    positions={positions}
                    onSubmit={handleSubmitTransaction}
                    onCancel={() => setModalTransactionOuvert(false)}
                />
            </Modal>

            {/* Modal ajout transaction crypto */}
            <Modal 
                isOpen={modalCryptoTransactionOuvert} 
                onClose={() => setModalCryptoTransactionOuvert(false)} 
                title={`${cryptoTransactionType === 'buy' ? 'Achat' : 'Vente'} de crypto`}
            >
                <CryptoTransactionForm
                    type={cryptoTransactionType}
                    positions={positionsCrypto.map(p => p.coin_id)}
                    onSubmit={handleSubmitCryptoTransaction}
                    onCancel={() => setModalCryptoTransactionOuvert(false)}
                />
            </Modal>

            {/* Modal ajout bien immobilier */}
            <Modal isOpen={modalImmoOuvert} onClose={() => setModalImmoOuvert(false)} title="Ajouter un bien immobilier">
                <FormBienImmobilier onSubmit={handleAjouterBien} onAnnuler={() => setModalImmoOuvert(false)} />
            </Modal>
        </Layout>
    )
}

export default Investir
