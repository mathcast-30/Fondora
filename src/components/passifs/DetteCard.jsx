// src/components/passifs/DetteCard.jsx

const CONFIG_TYPE = {
    Immobilier: { couleur: '#3B82F6', bg: '#EFF6FF', emoji: '🏠' },
    Consommation: { couleur: '#EF4444', bg: '#FEF2F2', emoji: '🔴' },
    Automobile: { couleur: '#6B7280', bg: '#F9FAFB', emoji: '🚗' },
    Fiscale: { couleur: '#F59E0B', bg: '#FFFBEB', emoji: '🟡' },
    'Dette Privée': { couleur: '#10B981', bg: '#F0FDF4', emoji: '🟢' },
    Autre: { couleur: '#8B5CF6', bg: '#F5F3FF', emoji: '📋' },
};

export function DetteCard({ dette, onEdit, onDelete, onVoirTableau }) {
    const config = CONFIG_TYPE[dette.type] || CONFIG_TYPE['Autre'];
    const moisRestants = dette.estRembourse ? 0 :
        Math.max(0, dette.duree_mois - Math.floor(
            (Date.now() - new Date(dette.date_debut)) / (1000 * 60 * 60 * 24 * 30.44)
        ));

    return (
        <div style={{ border: `1px solid ${config.couleur}30`, borderRadius: 12, padding: 20 }}>

            {/* En-tête : badge type + nom + actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{
                        background: config.bg,
                        color: config.couleur,
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                    }}>
                        {config.emoji} {dette.type}
                    </span>
                    <h3 style={{ margin: '8px 0 0', fontSize: 18 }}>{dette.nom}</h3>

                    {/* Lien vers le bien immo si applicable */}
                    {dette.biens_immobiliers && (
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
                            🏠 Lié au bien : <strong>{dette.biens_immobiliers.nom}</strong>
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onEdit(dette)}>✏️</button>
                    <button onClick={() => onVoirTableau(dette)}>📊</button>
                    <button onClick={() => onDelete(dette.id)}>🗑️</button>
                </div>
            </div>

            {/* Chiffres principaux */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Capital Restant Dû</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: config.couleur }}>
                        {dette.crd.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Mensualité</p>
                    <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                        {dette.mensualite.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/mois
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Fin prévue</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                        {dette.dateFin.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>{moisRestants} mois restants</p>
                </div>
            </div>

            {/* Barre de progression */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>Remboursé</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{dette.progression}%</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 9999, height: 8 }}>
                    <div style={{
                        width: `${dette.progression}%`,
                        background: config.couleur,
                        borderRadius: 9999,
                        height: '100%',
                        transition: 'width 0.5s ease',
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        0 € · Début {new Date(dette.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {dette.capital_emprunte.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
            </div>

            {/* Coût total des intérêts */}
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, marginBottom: 0 }}>
                💡 Coût total des intérêts : {dette.coutTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                · Taux : {dette.taux_interet}%
            </p>
        </div>
    );
}