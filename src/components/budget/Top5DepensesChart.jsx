import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Top5DepensesChart({ transactions = [] }) {
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
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                    <p className="font-semibold text-navy mb-1">{label}</p>
                    <p className="text-sm text-red-500 font-medium">-{formatMontant(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    // Couleurs dégradées de rouge à jaune
    const colors = ['#7f1d1d', '#b91c1c', '#dc2626', '#ea580c', '#eab308'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-navy font-semibold">Top 5 Dépenses</h3>
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
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `€${val}`} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1e3a5f', fontWeight: 500 }} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
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
