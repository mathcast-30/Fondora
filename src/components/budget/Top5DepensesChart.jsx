import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useIncognito } from '../../context/IncognitoContext';

export default function Top5DepensesChart({ transactions = [] }) {
    const { incognito } = useIncognito();
    const [periode, setPeriode] = useState('actuel');

    const hasData = transactions && transactions.length > 0;

    let data = [];
    if (hasData) {
        const depenses = transactions.filter(t => t.type === 'depense');
        const catMap = {};
        
        depenses.forEach(t => {
            const catName = t.categories?.nom || 'Autre';
            if (!catMap[catName]) catMap[catName] = 0;
            catMap[catName] += Number(t.montant);
        });
        
        data = Object.keys(catMap).map(key => ({
            name: key,
            montant: catMap[key]
        }))
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 5);
    } else {
        data = [
            { name: 'Logement', montant: 900 },
            { name: 'Alimentation', montant: 320 },
            { name: 'Loisirs', montant: 210 },
            { name: 'Transport', montant: 95 },
            { name: 'Santé', montant: 60 },
        ];
    }

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
                    <p className="font-semibold text-[var(--text-h)] mb-1">{label}</p>
                    <p className="text-sm text-[var(--negative)] font-medium">-{incognito ? '••••' : formatMontant(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    // Couleurs dégradées de rouge à jaune
    const colors = ['#7f1d1d', '#b91c1c', '#dc2626', '#ea580c', '#eab308'];

    return (
        <div className="bg-card rounded-2xl border border-[var(--border)] p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[var(--text-h)] font-semibold">Top 5 Dépenses</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPeriode('actuel')}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${periode === 'actuel' ? 'bg-surface text-[var(--text-h)] border border-[var(--border-strong)]' : 'bg-surface text-[var(--text)] hover:text-[var(--text-h)]'}`}
                    >
                        Mois actuel
                    </button>
                    <button 
                        onClick={() => setPeriode('precedent')}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${periode === 'precedent' ? 'bg-surface text-[var(--text-h)] border border-[var(--border-strong)]' : 'bg-surface text-[var(--text)] hover:text-[var(--text-h)]'}`}
                    >
                        Mois précédent
                    </button>
                </div>
            </div>
            
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text)' }} tickFormatter={(val) => incognito ? '••••' : `€${val}`} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-h)', fontWeight: 500 }} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="montant" radius={[0, 4, 4, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
