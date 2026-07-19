function StatCard({ label, valeur, sousTexte, couleur }) {
    return (
        <div className="bg-card rounded-xl p-5 border" style={{ borderColor: 'var(--border)' }}>
            <p className="kpi-label mb-2">{label}</p>
            <p className="kpi-value" style={couleur ? { color: couleur } : undefined}>{valeur}</p>
            {sousTexte && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sousTexte}</p>}
        </div>
    )
}

export default StatCard