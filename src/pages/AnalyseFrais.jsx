import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ShieldAlert, AlertTriangle, TrendingDown } from 'lucide-react'
import Layout from '../components/Layout'
import { useAnalyseFrais } from '../hooks/useAnalyseFrais'

export default function AnalyseFrais() {
    const { kpis, simulateur, loading, donnees } = useAnalyseFrais()

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)
    const formatPourcent = (p) => new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }).format(p)

    // Extraction des points clés à 10, 20 et 30 ans
    const getPoint = (annee) => simulateur.find(s => s.annee === annee) || { manqueAGagner: 0 }
    const manque10Ans = getPoint(10).manqueAGagner
    const manque20Ans = getPoint(20).manqueAGagner
    const manque30Ans = getPoint(30).manqueAGagner

    // Fonds toxiques (frais > 1.5%)
    const fondsToxiques = donnees.positions.filter(p => (p.frais_ter_produit || 0) + (p.comptes?.frais_gestion_enveloppe || 0) > 1.5)

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-navy text-3xl font-bold mb-1">Analyseur de Frais & Manque à Gagner</h1>
                <p className="text-gray-500">Expose l'impact destructeur de tes frais sur le long terme.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 text-gray-500">Calcul en cours...</div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-4 bg-orange-100 rounded-xl">
                                <AlertTriangle className="text-orange-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Taux Frais Global Moyen</p>
                                <p className="text-2xl font-bold text-navy">{formatPourcent(kpis.tauxFraisMoyen)} <span className="text-sm font-normal">/ an</span></p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-4 bg-red-100 rounded-xl">
                                <TrendingDown className="text-red-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Frais Prélevés (Année 1)</p>
                                <p className="text-2xl font-bold text-red-500">{formatMontant(kpis.totalFraisAnnuels)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-4 bg-purple-100 rounded-xl">
                                <ShieldAlert className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Manque à Gagner (30 ans)</p>
                                <p className="text-2xl font-bold text-purple-600">{formatMontant(manque30Ans)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Simulateur Graph */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-bold text-navy">Destruction de Valeur par les Frais</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Trajectoire simulée avec un rendement brut historique de 7%. 
                                    La zone rouge représente la richesse transférée à ton banquier.
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-semibold uppercase">Impact à 20 ans</p>
                                <p className="text-xl font-bold text-red-500">-{formatMontant(manque20Ans)}</p>
                            </div>
                        </div>
                        
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulateur} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="annee" tickFormatter={(v) => `Année ${v}`} />
                                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <Tooltip 
                                        formatter={(value, name) => [formatMontant(value), name === 'capitalSansFrais' ? 'Potentiel sans frais (7%)' : 'Ta poche (Net de frais)']}
                                        labelFormatter={(label) => `Année ${label}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="capitalSansFrais" stroke="#ef4444" fillOpacity={1} fill="url(#colorBrut)" name="capitalSansFrais" />
                                    <Area type="monotone" dataKey="capitalAvecFrais" stroke="#10b981" fillOpacity={1} fill="url(#colorNet)" name="capitalAvecFrais" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table des fonds toxiques */}
                    {fondsToxiques.length > 0 && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                            <h3 className="text-red-700 font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} /> Attention : Actifs Hautement Toxiques détectés
                            </h3>
                            <div className="bg-white rounded-xl overflow-hidden border border-red-100">
                                <table className="w-full text-left">
                                    <thead className="bg-red-50 text-red-700 text-sm">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Nom de l'actif</th>
                                            <th className="px-4 py-3 font-semibold">ISIN / Ticker</th>
                                            <th className="px-4 py-3 font-semibold text-right">Frais Enveloppe</th>
                                            <th className="px-4 py-3 font-semibold text-right">Frais Produit</th>
                                            <th className="px-4 py-3 font-semibold text-right">Coût Total Annuel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-50">
                                        {fondsToxiques.map((p, i) => (
                                            <tr key={i} className="text-sm">
                                                <td className="px-4 py-3 font-medium text-navy">{p.nom || p.symbole}</td>
                                                <td className="px-4 py-3 text-gray-500">{p.isin || p.symbole}</td>
                                                <td className="px-4 py-3 text-right text-gray-500">{p.comptes?.frais_gestion_enveloppe || 0}%</td>
                                                <td className="px-4 py-3 text-right text-gray-500">{p.frais_ter_produit || 0}%</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-600">
                                                    {((p.frais_ter_produit || 0) + (p.comptes?.frais_gestion_enveloppe || 0)).toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    )
}
