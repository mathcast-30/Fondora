import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

const fmt = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(m)
const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1d', fontFamily: 'Inter, system-ui, sans-serif' }

export default function PartagePublic() {
    const { token } = useParams()
    const [statut, setStatut] = useState('loading')
    const [erreur, setErreur] = useState('')
    const [data, setData] = useState(null)
    const [masque, setMasque] = useState(false)

    useEffect(() => {
        (async () => {
            try {
                const { data: res, error } = await supabase.functions.invoke('voir-partage', { body: { token } })
                if (error || res?.error) { setErreur(res?.error || error.message); setStatut('erreur'); return }
                setData(res); setMasque(!!res.masquer_montants); setStatut('ok')
            } catch (err) { setErreur(err.message); setStatut('erreur') }
        })()
    }, [token])

    if (statut === 'loading') return <div style={pageStyle}><p style={{ color: '#94a3b8' }}>Chargement…</p></div>

    if (statut === 'erreur') return (
        <div style={pageStyle}>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h1 style={{ color: '#f8fafc', fontSize: 20, marginBottom: 8 }}>Lien indisponible</h1>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>{erreur}</p>
            </div>
        </div>
    )

    const s = data.dernierSnapshot || {}
    const net = Number(s.total_cash || 0) + Number(s.total_bourse || 0) + Number(s.total_crypto || 0) +
        Number(s.total_assurance_vie || 0) + Number(s.total_immo_net || 0) + Number(s.total_tangible || 0) - Number(s.total_dettes || 0)
    const chartData = (data.historique || []).map(h => ({
        date: h.date,
        net: Number(h.total_cash || 0) + Number(h.total_bourse || 0) + Number(h.total_crypto || 0) +
            Number(h.total_assurance_vie || 0) + Number(h.total_immo_net || 0) + Number(h.total_tangible || 0) - Number(h.total_dettes || 0),
    }))
    const aff = (v) => masque ? '•••• €' : fmt(v)

    return (
        <div style={{ ...pageStyle, alignItems: 'stretch', padding: '40px 20px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={22} color="#10b981" />
                        <div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>Patrimoine partagé — lecture seule</p>
                            <h1 style={{ margin: 0, color: '#f8fafc', fontSize: 20, fontWeight: 700 }}>{data.nom_partage}</h1>
                        </div>
                    </div>
                    {data.masquer_montants && (
                        <button onClick={() => setMasque(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                            {masque ? <><Eye size={13} /> Afficher</> : <><EyeOff size={13} /> Masquer</>}
                        </button>
                    )}
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Patrimoine net</p>
                    <p style={{ margin: '4px 0 0', color: '#f8fafc', fontSize: 32, fontWeight: 800 }}>{aff(net)}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[['Cash', s.total_cash], ['Bourse', s.total_bourse], ['Crypto', s.total_crypto], ['Assurance-vie', s.total_assurance_vie], ['Immobilier net', s.total_immo_net], ['Dettes', -Number(s.total_dettes || 0)]].map(([label, val]) => (
                        <div key={label} style={{ background: '#111a2c', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, padding: 14 }}>
                            <p style={{ margin: 0, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>{label}</p>
                            <p style={{ margin: '4px 0 0', color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{aff(val || 0)}</p>
                        </div>
                    ))}
                </div>

                {chartData.length >= 2 ? (
                    <div style={{ background: '#111a2c', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 16, padding: 20 }}>
                        <p style={{ margin: '0 0 12px', color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>Évolution du patrimoine net</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="gradPartage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => masque ? '•••' : fmt(v)} />
                                <Tooltip formatter={(v) => aff(v)} contentStyle={{ background: '#1a2537', border: 'none', borderRadius: 8, color: '#fff' }} />
                                <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#gradPartage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>Pas encore assez d'historique.</p>}

                <p style={{ textAlign: 'center', color: '#475569', fontSize: 11, marginTop: 32 }}>Partagé via Fondora — lecture seule.</p>
            </div>
        </div>
    )
}