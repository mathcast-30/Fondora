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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            {/* KPI 1 — Dette Totale Restante */}
            <div className="bg-[#1a2537] border border-[rgba(148,163,184,0.08)] rounded-xl p-5 md:p-6">
                <h2 className="text-[#64748b] text-[0.8rem] uppercase tracking-[0.05em] mb-1 font-inter">
                    Dette Totale Restante
                </h2>
                <p className="text-[#f87171] text-[2rem] font-[700] tracking-[-0.02em] leading-[1.5] font-inter">
                    - <SecureValue value={kpis.totalDettes} formatter={v => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'} />
                </p>
                <p className="text-[#64748b] text-sm mt-1 font-inter">
                    {kpis.nombreActifs} crédit(s) actif(s)
                </p>
            </div>

            {/* KPI 2 — Mensualités */}
            <div className="bg-[#1a2537] border border-[rgba(148,163,184,0.08)] rounded-xl p-5 md:p-6">
                <h2 className="text-[#64748b] text-[0.8rem] uppercase tracking-[0.05em] mb-1 font-inter">
                    Mensualités Totales
                </h2>
                <p className="text-[#f8fafc] text-[2rem] font-[700] tracking-[-0.02em] leading-[1.5] font-inter">
                    <SecureValue value={kpis.totalMensualites} formatter={v => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'} />
                    <span className="text-[#64748b] text-sm font-[400] ml-1">/ mois</span>
                </p>
                <p className="text-[#64748b] text-sm mt-1 font-inter">
                    Charges de remboursement mensuelles
                </p>
            </div>

            {/* KPI 3 — Taux d'endettement */}
            <div className="bg-[#1a2537] border border-[rgba(148,163,184,0.08)] rounded-xl p-5 md:p-6">
                <h2 className="text-[#64748b] text-[0.8rem] uppercase tracking-[0.05em] mb-1 font-inter">
                    Taux d'Endettement
                </h2>
                <p style={{ color: couleurTaux }} className="text-[2rem] font-[700] tracking-[-0.02em] leading-[1.5] font-inter">
                    {tauxEndettement !== null ? `${tauxEndettement}%` : 'N/A'}
                </p>
                <p style={{ color: couleurTaux }} className="text-xs font-semibold mb-2 font-inter">
                    {tauxEndettement !== null ? labelTaux : 'Aucun revenu renseigné'}
                </p>
                {/* Barre de progression */}
                <div className="bg-[#334155] rounded-full h-1.5 overflow-hidden">
                    <div
                        style={{
                            width: `${largeurBarre}%`,
                            backgroundColor: couleurTaux,
                        }}
                        className="h-full rounded-full transition-all duration-500 ease-out"
                    />
                </div>
                <p className="text-[11px] text-[#64748b] mt-1 font-inter">
                    0% — 50% (max visuel)
                </p>
            </div>

        </div>
    );
}