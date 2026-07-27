// src/components/passifs/DetteCard.jsx
import SecureValue from '../SecureValue';

const BADGE_STYLES = {
    Immobilier: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Consommation: 'bg-red-500/10 text-red-400 border-red-500/20',
    Fiscale: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Automobile: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Dette Privée': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Autre: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function DetteCard({ dette, onEdit, onDelete, onVoirTableau }) {
    const badgeStyle = BADGE_STYLES[dette.type] || BADGE_STYLES['Autre'];

    // Calcul des mois restants (via dateFin enrichie)
    const maintenant = new Date();
    const moisRestants = dette.estRembourse ? 0 : Math.max(0, Math.round(
        (dette.dateFin - maintenant) / (1000 * 60 * 60 * 24 * 30.44)
    ));

    const finProche = !dette.estRembourse && moisRestants <= 6 && moisRestants > 0;

    // Si crédit soldé : affichage adapté
    if (dette.estRembourse) {
        return (
            <div className="bg-[#1a2537] border border-[rgba(148,163,184,0.08)] rounded-xl p-5 mb-4 flex flex-col md:flex-row justify-between md:items-center gap-4 opacity-75">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-[#f8fafc] font-[600] text-lg font-inter">
                            {dette.nom}
                        </h3>
                        <span className={`border px-2 py-1 text-xs rounded-md font-inter ${badgeStyle}`}>
                            {dette.type}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-xs rounded-md font-inter">
                            ✅ Crédit soldé
                        </span>
                    </div>
                    {dette.biens_immobiliers && (
                        <p className="text-[#94a3b8] text-sm mt-1 font-inter leading-[1.5]">
                            Lié au bien : {dette.biens_immobiliers.nom}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDelete(dette.id)}
                        className="text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm transition"
                        title="Supprimer"
                    >
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a2537] border border-[rgba(148,163,184,0.08)] rounded-xl p-5 mb-4 flex flex-col gap-4">
            {/* Ligne principale haut : Titre, badge, montants & actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                {/* Informations de base */}
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Titre de la dette */}
                        <h3 className="text-[#f8fafc] font-[600] text-lg font-inter">
                            {dette.nom}
                        </h3>

                        {/* Badge de couleur dynamique */}
                        <span className={`border px-2 py-1 text-xs rounded-md font-inter ${badgeStyle}`}>
                            {dette.type}
                        </span>

                        {finProche && (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 text-xs rounded-md font-inter">
                                ⏱️ Fin dans {moisRestants} mois
                            </span>
                        )}
                    </div>

                    {/* Texte courant / Description */}
                    {dette.biens_immobiliers && (
                        <p className="text-[#94a3b8] text-sm mt-1 font-inter leading-[1.5]">
                            Lié au bien : {dette.biens_immobiliers.nom}
                        </p>
                    )}
                </div>

                {/* Montants & Actions */}
                <div className="flex flex-col md:items-end gap-2">
                    <div className="md:text-right">
                        {/* Mensualité impactant le budget */}
                        <p className="text-[#f87171] font-[700] text-xl font-inter">
                            - <SecureValue value={dette.mensualite} formatter={v => v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'} /> <span className="text-[#64748b] text-sm font-[400]">/ mois</span>
                        </p>
                        {/* Texte secondaire */}
                        <p className="text-[#64748b] text-sm mt-1 font-inter">
                            Capital restant : <SecureValue value={dette.crd} formatter={v => v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'} />
                        </p>
                    </div>

                    {/* Boutons d'actions rapides */}
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => onVoirTableau(dette)}
                            className="bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 text-xs rounded-lg font-inter transition"
                            title="Tableau d'amortissement"
                        >
                            📊 Amortissement
                        </button>
                        <button
                            onClick={() => onEdit(dette)}
                            className="bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 text-xs rounded-lg font-inter transition"
                            title="Modifier"
                        >
                            ✏️ Modifier
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm(`Supprimer la dette "${dette.nom}" ?`)) {
                                    onDelete(dette.id);
                                }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 text-xs rounded-lg font-inter transition"
                            title="Supprimer"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            {/* Progression & Détails additionnels */}
            <div className="pt-3 border-t border-[rgba(148,163,184,0.08)]">
                <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-[#64748b]">Progression du remboursement</span>
                    <span className="text-[#94a3b8] font-semibold">{dette.progression}%</span>
                </div>
                <div className="bg-[#0a0f1d] rounded-full h-2 overflow-hidden mb-2">
                    <div
                        style={{ width: `${dette.progression}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                </div>
                <div className="flex justify-between items-center text-xs text-[#64748b]">
                    <span>Fin : {dette.dateFin.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} ({moisRestants} mois)</span>
                    <span>Taux : {dette.taux_interet}%</span>
                </div>
            </div>
        </div>
    );
}