// src/components/passifs/DetteCard.jsx
import SecureValue from '../SecureValue';

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

    // Calcul des mois restants (via dateFin enrichie)
    const maintenant = new Date();
    const moisRestants = dette.estRembourse ? 0 : Math.max(0, Math.round(
        (dette.dateFin - maintenant) / (1000 * 60 * 60 * 24 * 30.44)
    ));

    const finProche = !dette.estRembourse && moisRestants <= 6 && moisRestants > 0;

    const btnStyle = {
        background: 'none',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: 16,
        transition: 'background 0.15s',
    };

    // Si crédit soldé : affichage simplifié
    if (dette.estRembourse) {
        return (
            <div style={{
                border: `1px solid #10B98130`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                background: '#F0FDF4',
                opacity: 0.8,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            background: '#D1FAE5', color: '#10B981',
                            padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        }}>
                            {config.emoji} {dette.type}
                        </span>
                        <h3 style={{ margin: 0, fontSize: 16, color: '#374151' }}>{dette.nom}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            background: '#10B981', color: '#fff',
                            padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        }}>
                            ✅ Crédit soldé
                        </span>
                        <button onClick={() => onDelete(dette.id)} style={btnStyle} title="Supprimer">🗑️</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            border: `1px solid ${config.couleur}30`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>

            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                        {finProche && (
                            <span style={{
                                background: '#FEF3C7', color: '#D97706',
                                padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            }}>
                                ⏱️ Fin dans {moisRestants} mois
                            </span>
                        )}
                    </div>
                    <h3 style={{ margin: '8px 0 0', fontSize: 18, color: '#111827' }}>{dette.nom}</h3>

                    {/* Lien bien immo */}
                    {dette.biens_immobiliers && (
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
                            🏠 Lié au bien : <strong>{dette.biens_immobiliers.nom}</strong>
                        </p>
                    )}
                </div>

                {/* Boutons actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                        onClick={() => onEdit(dette)}
                        style={btnStyle}
                        title="Modifier"
                    >✏️</button>
                    <button
                        onClick={() => onVoirTableau(dette)}
                        style={btnStyle}
                        title="Tableau d'amortissement"
                    >📊</button>
                    <button
                        onClick={() => {
                            if (window.confirm(`Supprimer la dette "${dette.nom}" ?`)) {
                                onDelete(dette.id);
                            }
                        }}
                        style={{ ...btnStyle, borderColor: '#FECACA', color: '#EF4444' }}
                        title="Supprimer"
                    >🗑️</button>
                </div>
            </div>

            {/* Grille 3 colonnes : CRD / Mensualité / Date de fin */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px', fontWeight: 500 }}>Capital Restant Dû</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: config.couleur }}>
                        <SecureValue value={dette.crd} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} />
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px', fontWeight: 500 }}>Mensualité</p>
                    <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                        <SecureValue value={dette.mensualite} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} /><span style={{ fontSize: 13, color: '#6B7280' }}>/mois</span>
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px', fontWeight: 500 }}>Fin prévue</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>
                        {dette.dateFin.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{moisRestants} mois restants</p>
                </div>
            </div>

            {/* Barre de progression */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>Remboursé</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: config.couleur }}>{dette.progression}%</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
                    <div style={{
                        width: `${dette.progression}%`,
                        background: `linear-gradient(90deg, ${config.couleur}99, ${config.couleur})`,
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
                        <SecureValue value={dette.capital_emprunte} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} />
                    </span>
                </div>
            </div>

            {/* Pied de carte */}
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, marginBottom: 0, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
                💡 Coût total des intérêts :{' '}
                <strong style={{ color: '#6B7280' }}>
                    <SecureValue value={dette.coutTotal} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} />
                </strong>
                {' '}· Taux : <strong style={{ color: '#6B7280' }}>{dette.taux_interet}%</strong>
            </p>
        </div>
    );
}