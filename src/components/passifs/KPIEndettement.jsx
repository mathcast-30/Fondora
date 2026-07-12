// src/components/passifs/KPIEndettement.jsx
import SecureValue from '../SecureValue';

export function KPIEndettement({ kpis, revenusRecurrents }) {
    const tauxEndettement = revenusRecurrents > 0
        ? Math.round((kpis.totalMensualites / revenusRecurrents) * 100)
        : null;

    const couleurTaux =
        tauxEndettement > 35 ? '#EF4444' :
            tauxEndettement > 25 ? '#F59E0B' :
                '#10B981';

    const labelTaux =
        tauxEndettement > 35 ? '⚠️ Élevé — seuil bancaire : 35%' :
            tauxEndettement > 25 ? '⚡ Modéré' :
                '✅ Sain';

    // Barre de progression : max visuel à 50% = plein
    const largeurBarre = tauxEndettement !== null
        ? Math.min(100, Math.round((tauxEndettement / 50) * 100))
        : 0;

    const cardStyle = {
        background: 'var(--color-graylight, #f1f5f9)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: 20,
    };

    const labelStyle = {
        fontSize: 13,
        color: '#6B7280',
        margin: '0 0 6px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    };

    const valuStyle = (color) => ({
        fontSize: 28,
        fontWeight: 700,
        margin: '0 0 4px',
        color: color || 'var(--color-navy, #0a1f33)',
    });

    const subStyle = {
        fontSize: 13,
        color: '#6B7280',
        margin: 0,
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>

            {/* KPI 1 — Dette totale (CRD) */}
            <div style={cardStyle}>
                <p style={labelStyle}>Dette Totale (CRD)</p>
                <p style={valuStyle('#EF4444')}>
                    <SecureValue value={kpis.totalDettes} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} />
                </p>
                <p style={subStyle}>{kpis.nombreActifs} crédit(s) actif(s)</p>
            </div>

            {/* KPI 2 — Mensualités */}
            <div style={cardStyle}>
                <p style={labelStyle}>Mensualités Totales</p>
                <p style={valuStyle()}>
                    <SecureValue value={kpis.totalMensualites} formatter={v => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} />
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#6B7280' }}>/mois</span>
                </p>
                <p style={subStyle}>Charges de remboursement mensuelles</p>
            </div>

            {/* KPI 3 — Taux d'endettement */}
            <div style={cardStyle}>
                <p style={labelStyle}>Taux d'Endettement</p>
                <p style={{ ...valuStyle(couleurTaux), marginBottom: 2 }}>
                    {tauxEndettement !== null ? `${tauxEndettement}%` : 'N/A'}
                </p>
                <p style={{ ...subStyle, color: couleurTaux, fontWeight: 600, marginBottom: 10 }}>
                    {tauxEndettement !== null ? labelTaux : 'Aucun revenu renseigné'}
                </p>
                {/* Barre de progression */}
                <div style={{ background: '#E5E7EB', borderRadius: 9999, height: 6, overflow: 'hidden' }}>
                    <div style={{
                        width: `${largeurBarre}%`,
                        background: couleurTaux,
                        height: '100%',
                        borderRadius: 9999,
                        transition: 'width 0.6s ease',
                    }} />
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    0% — 50% (max visuel)
                </p>
            </div>

        </div>
    );
}