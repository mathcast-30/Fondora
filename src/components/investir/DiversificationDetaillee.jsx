import React, { useMemo } from 'react'
import { useLookThrough } from '../../hooks/useLookThrough'
import SecureValue from '../SecureValue'
import BenchmarkChart from './BenchmarkChart'
import { PieChart, Globe, DollarSign, Percent, BarChart3, Filter } from 'lucide-react'

const PALETTE = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#3b82f6', '#eab308', '#64748b']

function HorizontalBarList({ titre, data, dimension, onSelectSegment, segmentSelectionne }) {
    if (!data?.lignes?.length) {
        return (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex-1">
                <h4 className="text-navy font-semibold text-sm mb-3">{titre}</h4>
                <p className="text-gray-400 text-xs">Aucune donnée disponible</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-navy font-semibold text-sm m-0">{titre}</h4>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    data.tauxCouverture >= 70 ? 'bg-emerald/10 text-emerald' : 'bg-amber-100 text-amber-700'
                }`}>
                    {data.tauxCouverture}% couvert
                </span>
            </div>
            <div className="space-y-3">
                {data.lignes.map((ligne, idx) => {
                    const isSelected = segmentSelectionne?.dimension === dimension && segmentSelectionne?.libelle === ligne.libelle
                    const isClickable = ligne.libelle !== 'Non couvert' && !!onSelectSegment
                    const color = ligne.libelle === 'Non couvert' ? '#64748b' : PALETTE[idx % PALETTE.length]

                    return (
                        <div
                            key={ligne.libelle}
                            onClick={() => {
                                if (isClickable) {
                                    onSelectSegment(dimension, isSelected ? null : ligne.libelle)
                                }
                            }}
                            className={`group rounded-lg p-1.5 transition-all ${
                                isClickable ? 'cursor-pointer hover:bg-slate-50' : ''
                            } ${isSelected ? 'bg-indigo-50/80 ring-1 ring-indigo-300' : ''}`}
                        >
                            <div className="flex justify-between text-xs mb-1 font-medium">
                                <span className={`${isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>
                                    {ligne.libelle}
                                </span>
                                <span className="text-slate-500 font-semibold">
                                    {ligne.pourcentage}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, ligne.pourcentage))}%`,
                                        backgroundColor: color
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function DiversificationDetaillee({
    positions = [],
    transactions = [],
    compteFiltre = 'TOUS',
    onCompteChange,
    segmentSelectionne,
    onSegmentClick
}) {
    const { loading, geo, secteur, devise, terPondere, valeurTotale } = useLookThrough(positions)

    // Calculs pour les 4 KPIs principaux
    const { topPays, topSecteur, partTop3Pays } = useMemo(() => {
        const topP = geo?.lignes?.filter(l => l.libelle !== 'Non couvert')[0]?.libelle || 'N/A'
        const topS = secteur?.lignes?.filter(l => l.libelle !== 'Non couvert')[0]?.libelle || 'N/A'
        
        const top3P = (geo?.lignes?.filter(l => l.libelle !== 'Non couvert') || [])
            .slice(0, 3)
            .reduce((s, l) => s + l.pourcentage, 0)
        
        return {
            topPays: topP,
            topSecteur: topS,
            partTop3Pays: Math.round(top3P * 10) / 10
        }
    }, [geo, secteur])

    // Types de comptes disponibles dans les positions
    const comptesDisponibles = useMemo(() => {
        const setC = new Set((positions || []).map(p => p.type_compte).filter(Boolean))
        return ['TOUS', ...Array.from(setC)]
    }, [positions])

    return (
        <div className="space-y-6">
            {/* Header Diversification avec sélecteur de compte */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div>
                    <h3 className="text-navy font-bold text-lg mb-1 flex items-center gap-2">
                        <Globe className="text-indigo-600" size={20} />
                        Analyse approfondie de diversification
                    </h3>
                    <p className="text-xs text-gray-500">
                        Décomposition look-through des ETF, exposition géographique, sectorielle, devises et benchmark.
                    </p>
                </div>

                {onCompteChange && comptesDisponibles.length > 2 && (
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                        <span className="text-gray-400 px-2 flex items-center gap-1">
                            <Filter size={13} /> Compte :
                        </span>
                        {comptesDisponibles.map(c => (
                            <button
                                key={c}
                                onClick={() => onCompteChange(c)}
                                className={`px-3 py-1.5 rounded-md transition ${
                                    compteFiltre === c
                                        ? 'bg-navy text-white shadow-xs'
                                        : 'text-gray-600 hover:text-navy hover:bg-slate-200/60'
                                }`}
                            >
                                {c === 'TOUS' ? 'Tous les comptes' : c}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 4 Cartes Métriques Clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">1er Pays d'exposition</p>
                        <p className="text-navy font-bold text-base">{topPays}</p>
                        <p className="text-[11px] text-gray-400">Top 3 pays : {partTop3Pays}%</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center font-bold">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">1er Secteur</p>
                        <p className="text-navy font-bold text-base">{topSecteur}</p>
                        <p className="text-[11px] text-gray-400">{secteur?.tauxCouverture || 0}% de couverture</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Percent size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Frais ETF moyens (TER)</p>
                        <p className="text-navy font-bold text-base">
                            {terPondere !== null ? `${terPondere.toFixed(2)}% / an` : 'N/A'}
                        </p>
                        <p className="text-[11px] text-gray-400">Pondéré sur l'encours ETF</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Exposition devises</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {devise?.lignes?.slice(0, 3).map(d => (
                                <span key={d.libelle} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {d.libelle}: {d.pourcentage}%
                                </span>
                            )) || <span className="text-xs text-gray-400">N/A</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Répartition Sectorielle et Géographique en barres horizontales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HorizontalBarList
                    titre="🌍 Répartition Géographique"
                    dimension="geographique"
                    data={geo}
                    onSelectSegment={onSegmentClick}
                    segmentSelectionne={segmentSelectionne}
                />
                <HorizontalBarList
                    titre="🏭 Répartition Sectorielle"
                    dimension="sectoriel"
                    data={secteur}
                    onSelectSegment={onSegmentClick}
                    segmentSelectionne={segmentSelectionne}
                />
            </div>

            {/* Répartition par devises détaillée */}
            {devise?.lignes?.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-navy font-semibold text-sm flex items-center gap-2 m-0">
                            <DollarSign size={16} className="text-slate-500" />
                            Répartition des sous-jacents par Devise
                        </h4>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            devise.tauxCouverture >= 70 ? 'bg-emerald/10 text-emerald' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {devise.tauxCouverture}% estimé
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {devise.lignes.map((d, i) => (
                            <div key={d.libelle} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                                <span className="text-xs font-bold text-navy block">{d.libelle}</span>
                                <span className="text-xs text-indigo-600 font-semibold">{d.pourcentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Benchmark vs Indices de Référence */}
            <BenchmarkChart transactions={transactions} positions={positions} />
        </div>
    )
}
