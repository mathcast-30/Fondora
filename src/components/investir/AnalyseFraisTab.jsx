import React from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ShieldAlert, AlertTriangle, TrendingDown, Activity } from 'lucide-react'
import { useAnalyseFrais } from '../../hooks/useAnalyseFrais'

export default function AnalyseFraisTab() {
    const { kpis, simulateur, loading, donnees } = useAnalyseFrais()

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)
    const formatPourcent = (p) => new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(p)

    // Extraction des points clés à 20 et 30 ans
    const getPoint = (annee) => simulateur.find(s => s.annee === annee) || { siphonne: 0 }
    const manque20Ans = getPoint(20).siphonne
    const manque30Ans = getPoint(30).siphonne

    // Score de Santé des Frais
    const getScoreSante = (taux) => {
        const t = taux * 100
        if (t < 0.5) return { grade: 'A', color: 'bg-emerald-500 text-white', text: 'Excellent' }
        if (t < 1.0) return { grade: 'B', color: 'bg-blue-500 text-white', text: 'Bon' }
        if (t < 1.5) return { grade: 'C', color: 'bg-orange-500 text-white', text: 'Moyen' }
        return { grade: 'F', color: 'bg-red-600 text-white', text: 'Critique' }
    }
    const score = getScoreSante(kpis.tauxFraisMoyen)

    // Fonds toxiques (frais > 1.5%)
    // Triés par ordre décroissant de frais cumulés
    const fondsAvecFrais = donnees.positions.map(p => {
        const fraisEnv = p.comptes?.frais_gestion_enveloppe || 0
        const fraisProd = p.frais_ter_produit || 0
        return { ...p, fraisEnv, fraisProd, totalFrais: fraisEnv + fraisProd }
    }).sort((a, b) => b.totalFrais - a.totalFrais)

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex justify-center items-center h-64 text-gray-500">Calcul en cours...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center gap-4">
                            <div className="p-3 bg-slate-800 rounded-xl">
                                <Activity className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Taux Frais Moyen</p>
                                <p className="text-xl font-bold text-white">{formatPourcent(kpis.tauxFraisMoyen)} <span className="text-xs font-normal text-slate-500">/ an</span></p>
                            </div>
                        </div>
                        <div className="bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <TrendingDown className="text-red-500" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Frais Estimés (An 1)</p>
                                <p className="text-xl font-bold text-red-500">{formatMontant(kpis.totalFraisAnnuels)}</p>
                            </div>
                        </div>
                        <div className="bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <ShieldAlert className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">Siphonné (30 ans)</p>
                                <p className="text-xl font-bold text-purple-400">-{formatMontant(manque30Ans)}</p>
                            </div>
                        </div>
                        <div className="bg-[#0f172a] p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-1">Score de Santé</p>
                                <p className="text-sm font-semibold text-white">{score.text}</p>
                            </div>
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-black text-2xl shadow-lg ${score.color}`}>
                                {score.grade}
                            </div>
                        </div>
                    </div>

                    {/* Simulateur Graph */}
                    <div className="bg-[#0f172a] p-6 rounded-2xl shadow-sm border border-slate-800">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-bold text-white">Trajectoire & Manque à Gagner</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Projection à <span className="text-emerald-400 font-semibold">7% de rendement brut</span> vs trajectoire nette des frais.
                                    <br/>La zone rouge illustre la richesse siphonnée par l'industrie financière.
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-semibold uppercase">Impact à 20 ans</p>
                                <p className="text-2xl font-black text-red-500">-{formatMontant(manque20Ans)}</p>
                            </div>
                        </div>
                        
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulateur} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="annee" stroke="#475569" tickFormatter={(v) => `An ${v}`} />
                                    <YAxis stroke="#475569" tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <Tooltip 
                                        formatter={(value, name) => [formatMontant(value), name === 'capitalBrut' ? 'Potentiel Brut (7%)' : 'Net de Frais (Ta poche)']}
                                        labelFormatter={(label) => `Année ${label}`}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    {/* On dessine le Brut (Rouge) en dessous, puis le Net (Vert) par dessus. La différence visible est le siphonnage (Rouge) */}
                                    <Area type="monotone" dataKey="capitalBrut" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBrut)" name="capitalBrut" />
                                    <Area type="monotone" dataKey="capitalNet" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="capitalNet" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table des actifs avec alerte Toxique */}
                    {fondsAvecFrais.length > 0 && (
                        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg">Détail des Frais par Actif</h3>
                                {fondsAvecFrais.some(p => p.totalFrais > 1.5) && (
                                    <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle size={14} /> Actifs Toxiques Détectés
                                    </span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#1e293b] text-slate-400 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-5 py-3">Actif</th>
                                            <th className="px-5 py-3 text-right">Frais Enveloppe</th>
                                            <th className="px-5 py-3 text-right">Frais Produit (TER)</th>
                                            <th className="px-5 py-3 text-right">Coût Total</th>
                                            <th className="px-5 py-3 text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {fondsAvecFrais.map((p, i) => {
                                            const isToxique = p.totalFrais > 1.5;
                                            return (
                                                <tr key={i} className={`text-sm transition-colors hover:bg-[#1e293b]/50 ${isToxique ? 'bg-red-950/20' : ''}`}>
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-white">{p.nom || p.symbole}</p>
                                                        <p className="text-xs text-slate-500">{p.isin || p.symbole}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-right text-slate-400">{p.fraisEnv.toFixed(2)}%</td>
                                                    <td className="px-5 py-4 text-right text-slate-400">{p.fraisProd.toFixed(2)}%</td>
                                                    <td className={`px-5 py-4 text-right font-bold ${isToxique ? 'text-red-500' : 'text-white'}`}>
                                                        {p.totalFrais.toFixed(2)}%
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        {isToxique ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                                                <AlertTriangle size={12} /> Toxique
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                                                                Sain
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
