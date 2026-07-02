function StatCard({ label, valeur, sousTexte, couleur = '#0a1f33' }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-400 text-sm mb-1">{label}</p>
            <p className="font-bold text-xl" style={{ color: couleur }}>{valeur}</p>
            {sousTexte && <p className="text-xs text-gray-400 mt-1">{sousTexte}</p>}
        </div>
    )
}

export default StatCard