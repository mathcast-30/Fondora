import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useIncognito } from '../context/IncognitoContext';

const LAYERS = [
  { key: 'total_cash', label: 'Cash', color: '#3b82f6' },
  { key: 'total_bourse', label: 'Bourse', color: '#6366f1' },
  { key: 'total_crypto', label: 'Crypto', color: '#f97316' },
  { key: 'total_assurance_vie', label: 'Assurance-vie', color: '#10b981' },
  { key: 'total_immo_net', label: 'Immobilier net', color: '#8b5cf6' },
  { key: 'total_tangible', label: 'Actifs tangibles', color: '#eab308' },
];

const PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1A', months: 12 },
  { label: 'TOUT', months: null },
];

function formatYAxis(value) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k€`;
  return `${value}€`;
}

// Formatage adaptatif : jour+mois si la période couvre moins de ~60 jours,
// sinon mois+année pour ne pas surcharger l'axe sur de longues périodes.
function makeDateFormatter(dataset) {
  if (!dataset || dataset.length < 2) {
    return (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };
  }
  const first = new Date(dataset[0].date);
  const last = new Date(dataset[dataset.length - 1].date);
  const spanDays = (last - first) / (1000 * 60 * 60 * 24);

  if (spanDays <= 60) {
    return (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };
  }
  return (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  };
}

function formatTooltipDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  const dettes = payload.find(p => p.name === 'total_dettes')?.value || 0;
  const patrimoine = total - dettes;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text)', marginBottom: 6 }}>{formatTooltipDate(label)}</p>
      {payload.filter(p => p.name !== 'total_dettes').map(p => (
        <div key={p.name} className="flex justify-between gap-4" style={{ color: p.fill || p.stroke || 'var(--text-h)' }}>
          <span>{LAYERS.find(l => l.key === p.name)?.label || p.name}</span>
          <span>{formatYAxis(p.value)}</span>
        </div>
      ))}
      {dettes > 0 && (
        <div className="flex justify-between gap-4" style={{ color: '#f43f5e' }}>
          <span>Dettes</span><span>-{formatYAxis(dettes)}</span>
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, color: 'var(--text-h)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
        <span>Patrimoine net</span><span>{formatYAxis(patrimoine)}</span>
      </div>
    </div>
  );
};

export default function NetWorthChart({ height = 320 }) {
  const { incognito } = useIncognito();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('TOUT');

  useEffect(() => {
    const fetchSnapshots = async () => {
      const { data, error } = await supabase
        .from('snapshot_patrimoine')
        .select('date, total_cash, total_bourse, total_crypto, total_assurance_vie, total_immo_net, total_tangible, total_dettes')
        .order('date', { ascending: true });
      if (!error && data) setSnapshots(data);
      setLoading(false);
    };
    fetchSnapshots();
  }, []);

  const filtered = (() => {
    const p = PERIODS.find(x => x.label === period);
    if (!p?.months) return snapshots;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - p.months);
    return snapshots.filter(s => new Date(s.date) >= cutoff);
  })();

  const dateFormatter = makeDateFormatter(filtered);
  const yAxisTickFormatter = incognito ? () => '•••' : formatYAxis;

  if (loading) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
      Chargement...
    </div>
  );

  if (filtered.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text)', padding: '0 24px' }}>
      <p>📈 Votre historique de patrimoine apparaîtra ici après quelques jours d'utilisation.</p>
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {PERIODS.map(p => (
          <button
            key={p.label}
            onClick={() => setPeriod(p.label)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${period === p.label
              ? 'bg-surface text-[var(--text-h)] border border-[var(--border-strong)]'
              : 'bg-surface border border-[var(--border)] text-[var(--text)] hover:text-[var(--text-h)]'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={filtered} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <defs>
            {LAYERS.map(l => (
              <linearGradient key={l.key} id={`grad_${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={l.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={l.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            tick={{ fontSize: 11, fill: 'var(--text)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={yAxisTickFormatter}
            tick={{ fontSize: 11, fill: 'var(--text)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16, color: 'var(--text)' }}
            formatter={(value) => {
              const l = LAYERS.find(x => x.key === value);
              return l ? l.label : value;
            }}
          />
          {LAYERS.map(l => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stackId="1"
              stroke={l.color}
              fill={`url(#grad_${l.key})`}
              strokeWidth={1.5}
            />
          ))}
          <ReferenceLine
            y={0}
            stroke="#f43f5e"
            strokeDasharray="6 3"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}