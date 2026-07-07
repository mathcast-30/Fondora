// src/components/passifs/KPIEndettement.jsx

const COULEURS_TYPE = {
    Immobilier: '#3B82F6',    // bleu
    Consommation: '#EF4444',  // rouge
    Automobile: '#6B7280',    // gris
    Fiscale: '#F59E0B',       // jaune
    'Dette Privée': '#10B981', // vert
    Autre: '#8B5CF6',         // violet
};

export function KPIEndettement({ kpis, revenusRecurrents }) {
    const tauxEndettement = revenusRecurrents > 0
        ? Math.round((kpis.totalMensualites / revenusRecurrents) * 100)
        : null;

    const couleurTaux =
        tauxEndettement > 35 ? '#EF4444' :
            tauxEndettement > 25 ? '#F59E0B' :
                '#10B981';

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

            {/* KPI 1 — Dette totale */}
            <div className="kpi-card">
                <p className="kpi-label">Dette Totale (CRD)</p>
                <p className="kpi-value">
                    {kpis.totalDettes.toLocaleString('fr-FR', {
                        style: 'currency', currency: 'EUR'
                    })}
                </p>
                <p className="kpi-sub">{kpis.nombreActifs} crédit(s) actif(s)</p>
            </div>

            {/* KPI 2 — Mensualités */}
            <div className="kpi-card">
                <p className="kpi-label">Mensualités Totales</p>
                <p className="kpi-value">
                    {kpis.totalMensualites.toLocaleString('fr-FR', {
                        style: 'currency', currency: 'EUR'
                    })}/mois
                </p>
            </div>

            {/* KPI 3 — Taux d'endettement */}
            <div className="kpi-card">
                <p className="kpi-label">Taux d'Endettement</p>
                <p className="kpi-value" style={{ color: couleurTaux }}>
                    {tauxEndettement !== null ? `${tauxEndettement}%` : 'N/A'}
                </p>
                <p className="kpi-sub">
                    {tauxEndettement > 35 ? '⚠️ Élevé (seuil bancaire : 35%)' :
                        tauxEndettement > 25 ? '⚡ Modéré' : '✅ Sain'}
                </p>
            </div>

        </div>
    );
}