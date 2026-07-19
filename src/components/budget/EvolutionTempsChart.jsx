import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactionsPeriode } from '../../hooks/useTransactionsPeriode';
import { useIncognito } from '../../context/IncognitoContext';

export default function EvolutionTempsChart() {
    const { incognito } = useIncognito();
    const [periode, setPeriode] = useState('6M');

    const getNombreMois = (p) => {
        if (p === '3M') return 3;
        if (p === '6M') return 6;
        if (p === '1Y') return 12;
        return 6;
    };

    const { transactions } = useTransactionsPeriode(getNombreMois(periode));

    const hasData = transactions && transactions.length > 0;

    let data = [];
    if (hasData) {
        const moisMap = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const mois = date.toLocaleString('fr-FR', { month: 'short' });
            if (!moisMap[mois]) moisMap[mois] = { name: mois, depenses: 0, revenus: 0, sortDate: date };
            if (t.type === 'depense') moisMap[mois].depenses += Number(t.montant);
            else if (t.type === 'revenu') moisMap[mois].revenus += Number(t.montant);
        });
        data = Object.values(moisMap).sort((a, b) => a.sortDate - b.sortDate);
    }
    
    if (data.length === 0) {
        data = [
            { name: 'Fév', depenses: 2100, revenus: 3000 },
            { name: 'Mar', depenses: 2300, revenus: 3000 },
            { name: 'Avr', depenses: 1950, revenus: 3100 },
            { name: 'Mai', depenses: 2500, revenus: 3100 },
            { name: 'Juin', depenses: 2200, revenus: 3200 },
            { name: 'Juil', depenses: 1585, revenus: 3200 },
        ];
    }

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
                    <p className="font-semibold text-[var(--text-h)] mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} className="text-sm font-medium" style={{ color: entry.color }}>
                            {entry.name} : {incognito ? '••••' : formatMontant(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card rounded-2xl border border-[var(--border)] p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[var(--text-h)] font-semibold">Évolution dans le temps</h3>
                <div className="flex gap-2">
                    {['3M', '6M', '1Y'].map(p => (
                        <button 
                            key={p}
                            onClick={() => setPeriode(p)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition ${periode === p ? 'bg-surface text-[var(--text-h)] border border-[var(--border-strong)]' : 'bg-surface text-[var(--text)] hover:text-[var(--text-h)]'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text)' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text)' }} tickFormatter={(val) => incognito ? '••••' : `€${val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text)' }} />
                        <Line type="monotone" dataKey="revenus" name="Revenus" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} fillOpacity={0.1} />
                        <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} fillOpacity={0.1} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
