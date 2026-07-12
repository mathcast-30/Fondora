import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useIncognito } from '../../context/IncognitoContext';

export default function GraphiqueActif({ actifId }) {
  const { incognito } = useIncognito();
  const [periode, setPeriode] = useState('1Y'); // 7D, 30D, 1Y, MAX
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!actifId) return;
    const fetchHistorique = async () => {
      let dateLimite = new Date();
      if (periode === '7D') dateLimite.setDate(dateLimite.getDate() - 7);
      else if (periode === '30D') dateLimite.setDate(dateLimite.getDate() - 30);
      else if (periode === '1Y') dateLimite.setFullYear(dateLimite.getFullYear() - 1);
      else dateLimite = new Date(0); // Depuis le début (MAX)

      const { data: points } = await supabase
        .from('historique_prix_actifs')
        .select('date, prix_cloture')
        .eq('actif_id', actifId)
        .gte('date', dateLimite.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setData(points || []);
    };
    fetchHistorique();
  }, [actifId, periode]);

  if (!actifId) {
      return (
          <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 text-white flex items-center justify-center h-[330px]">
              <p className="text-slate-400">Sélectionnez un actif pour voir son historique.</p>
          </div>
      );
  }

  return (
    <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 text-white">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-slate-400">Évolution de la valeur</span>
        <div className="flex gap-1 bg-[#161b2c] p-1 rounded-xl text-xs">
          {['7D', '30D', '1Y', 'MAX'].map(p => (
            <button 
              key={p} 
              onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${periode === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {p === 'MAX' ? 'Début' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#161b2c', borderColor: '#334155', borderRadius: '12px' }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value) => incognito ? ['••••', 'Cours'] : [`${Number(value).toFixed(2)} €`, 'Cours']}
            />
            <Area type="monotone" dataKey="prix_cloture" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
