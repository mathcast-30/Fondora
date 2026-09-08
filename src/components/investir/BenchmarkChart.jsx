import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Info } from 'lucide-react'

export default function BenchmarkChart({ transactions = [], positions = [] }) {
    const [indices, setIndices] = useState([])
    const [selectedIndice, setSelectedIndice] = useState('CAC40')
    const [loading, setLoading] = useState(true)

    // Charger les rendements historiques depuis Supabase
    useEffect(() => {
        let isMounted = true
        supabase
            .from('rendements_historiques')
            .select('*')
            .order('annee', { ascending: true })
            .then(({ data, error }) => {
                if (!isMounted) return
                if (error) {
                    console.error('Error fetching rendements_historiques:', error)
                } else if (data) {
                    setIndices(data)
                }
                setLoading(false)
            })
            .catch(err => {
                console.error('Fetch error:', err)
                if (isMounted) setLoading(false)
            })

        return () => { isMounted = false }
    }, [])

    // Calcul du rendement annuel de l'utilisateur basé sur transactions et positions
    const { anneesUtilisateur, userPerfParAnnee } = useMemo(() => {
        const perfMap = {}
        const datesTx = (transactions || []).map(t => new Date(t.date)).filter(d => !isNaN(d.getTime()))
        
        // Trouver les années concernées
        const anneesDistinctes = [...new Set(datesTx.map(d => d.getFullYear()))].sort((a, b) => a - b)
        
        // Si pas assez de transactions, essayer d'utiliser date_achat des positions
        if (anneesDistinctes.length === 0) {
            for (const p of positions || []) {
                if (p.date_achat) {
                    const y = new Date(p.date_achat).getFullYear()
                    if (!isNaN(y) && !anneesDistinctes.includes(y)) anneesDistinctes.push(y)
                }
            }
            anneesDistinctes.sort((a, b) => a - b)
        }

        // Calcul indicatif simplifié du rendement par année
        // Pour chaque année où l'utilisateur a des transactions :
        for (const annee of anneesDistinctes) {
            const txAnnee = (transactions || []).filter(t => new Date(t.date).getFullYear() === annee)
            const buyTotal = txAnnee.filter(t => t.type === 'buy').reduce((s, t) => s + (t.quantity || t.quantite || 0) * (t.price || t.prix_unitaire || 0), 0)
            const sellTotal = txAnnee.filter(t => t.type === 'sell').reduce((s, t) => s + (t.quantity || t.quantite || 0) * (t.price || t.prix_unitaire || 0), 0)
            
            // Si année courante, comparer avec les positions actuelles
            const currentYear = new Date().getFullYear()
            if (annee === currentYear) {
                const totalInvesti = (positions || []).reduce((s, p) => s + (p.prix_achat_moyen * p.quantite), 0)
                const totalActuel = (positions || []).reduce((s, p) => {
                    const prix = p.coursActuel ?? p.cours ?? p.prix_achat_moyen
                    return s + (prix * p.quantite)
                }, 0)
                if (totalInvesti > 0) {
                    perfMap[annee] = Math.round(((totalActuel - totalInvesti) / totalInvesti) * 1000) / 10
                }
            } else if (buyTotal > 0) {
                perfMap[annee] = Math.round(((sellTotal - buyTotal) / buyTotal) * 1000) / 10
            }
        }

        return {
            anneesUtilisateur: anneesDistinctes,
            userPerfParAnnee: perfMap
        }
    }, [transactions, positions])

    const dataChart = useMemo(() => {
        const rowsForIndice = indices.filter(r => r.indice === selectedIndice)
        const allYears = [...new Set([...rowsForIndice.map(r => r.annee), ...anneesUtilisateur])].sort((a, b) => a - b)
        
        // Limiter aux années récentes disponibles (ex: 2020-2025)
        return allYears.map(annee => {
            const rowIndice = rowsForIndice.find(r => r.annee === annee)
            return {
                annee: String(annee),
                indice: rowIndice ? Number(rowIndice.rendement) : null,
                portefeuille: userPerfParAnnee[annee] !== undefined ? userPerfParAnnee[annee] : null
            }
        })
    }, [indices, selectedIndice, anneesUtilisateur, userPerfParAnnee])

    const indicesDisponibles = useMemo(() => {
        return [...new Set(indices.map(i => i.indice))]
    }, [indices])

    const hasLimitedHistory = anneesUtilisateur.length < 2

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={20} />
                    <h4 className="text-navy font-semibold text-base m-0">Comparaison aux indices de référence</h4>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="benchmark-select" className="text-xs text-gray-500 font-medium">
                        Indice :
                    </label>
                    <select
                        id="benchmark-select"
                        value={selectedIndice}
                        onChange={(e) => setSelectedIndice(e.target.value)}
                        className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-navy focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {indicesDisponibles.length > 0 ? (
                            indicesDisponibles.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))
                        ) : (
                            <>
                                <option value="CAC40">CAC40</option>
                                <option value="S&P500">S&P500</option>
                                <option value="NASDAQ">NASDAQ</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {hasLimitedHistory && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs mb-4">
                    <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
                    <div>
                        <span className="font-semibold">Historique encore limité : </span>
                        reviens dans quelques mois pour une comparaison plus parlante sur plusieurs années civiles.
                    </div>
                </div>
            )}

            {loading ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    Chargement des indices de référence...
                </div>
            ) : dataChart.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée de benchmark disponible.
                </div>
            ) : (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="annee" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip
                                formatter={(value, name) => [
                                    value !== null ? `${value}%` : 'N/A',
                                    name === 'indice' ? selectedIndice : 'Mon Portefeuille'
                                ]}
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                            />
                            <Legend
                                formatter={(val) => val === 'indice' ? selectedIndice : 'Mon Portefeuille'}
                                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                            />
                            <Bar dataKey="indice" name="indice" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="portefeuille" name="portefeuille" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
