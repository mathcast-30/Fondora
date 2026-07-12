import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useIncognito } from '../../context/IncognitoContext';

export default function BudgetVsReelChart({ transactions = [], budgets = [], categories = [] }) {
    const { incognito } = useIncognito();
    const [periode, setPeriode] = useState('actuel'); // 'actuel' ou 'precedent'

    const hasData = transactions && transactions.length > 0;

    let data = [];
    if (hasData) {
        const depenses = transactions.filter(t => t.type === 'depense');
        
        data = categories.filter(c => c.type === 'depense').map(cat => {
            const reel = depenses.filter(t => t.categorie_id === cat.id).reduce((s, t) => s + Number(t.montant), 0);
            const budgetObj = budgets.find(b => b.categorie_id === cat.id);
            const budget = budgetObj ? Number(budgetObj.montant_max) : 0;
            return {
                name: cat.nom,
                reel: reel,
                budget: budget,
                ecart: budget - reel
            };
        }).filter(d => d.reel > 0 || d.budget > 0);
    } else {
        data = [
            { name: 'Alimentation', reel: 320, budget: 400, ecart: 80 },
            { name: 'Logement', reel: 900, budget: 900, ecart: 0 },
            { name: 'Loisirs', reel: 210, budget: 150, ecart: -60 },
            { name: 'Transport', reel: 95, budget: 120, ecart: 25 },
            { name: 'Santé', reel: 60, budget: 80, ecart: 20 },
        ];
    }

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const budget = payload.find(p => p.dataKey === 'budget')?.value || 0;
            const reel = payload.find(p => p.dataKey === 'reel')?.value || 0;
            const ecart = budget - reel;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                    <p className="font-semibold text-navy mb-2">{label}</p>
                    <p className="text-sm text-slate-600">Budget : {incognito ? '••••' : formatMontant(budget)}</p>
                    <p className="text-sm text-slate-600">Réel : {incognito ? '••••' : formatMontant(reel)}</p>
                    <p className={`text-sm font-medium mt-1 ${ecart >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                        Écart : {ecart >= 0 ? '+' : ''}{incognito ? '••••' : formatMontant(ecart)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-navy font-semibold">Budget vs Réel</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPeriode('actuel')}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${periode === 'actuel' ? 'bg-navy text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
                    >
                        Mois actuel
                    </button>
                    <button 
                        onClick={() => setPeriode('precedent')}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${periode === 'precedent' ? 'bg-navy text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
                    >
                        Mois précédent
                    </button>
                </div>
            </div>
            
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => incognito ? '••••' : `€${val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="budget" name="Budget" fill="#1e3a5f" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="reel" name="Réel" radius={[4, 4, 0, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.reel > entry.budget ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
