import { useMemo, useState } from 'react';
import { useIncognito } from '../../context/IncognitoContext';

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const BADGE_COLOR = {
    transaction_depense: 'bg-emerald-400',
    transaction_revenu: 'bg-blue-400',
    abonnement: 'bg-indigo-400',
    loyer: 'bg-teal-400',
    credit: 'bg-amber-400',
    dette_auto: 'bg-red-400',
};

export default function CalendrierEcheances({ mois, annee, transactions = [], abonnements = [], dettes = [] }) {
    const { incognito } = useIncognito();
    const [jourSurvole, setJourSurvole] = useState(null);

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    const echeancesParJour = useMemo(() => {
        const map = {};
        const ajouter = (jour, item) => {
            if (!jour || jour < 1 || jour > 31) return;
            if (!map[jour]) map[jour] = [];
            map[jour].push(item);
        };

        // 1. Transactions récurrentes (manuelles, dettes auto, loyers auto)
        transactions
            .filter((t) => t.recurrente && t.recurrence_active !== false)
            .forEach((t) => {
                const jour = t.jour_recurrence || new Date(t.date).getDate();
                ajouter(jour, {
                    type: 'transaction',
                    nom: t.description || t.categories?.nom || 'Transaction',
                    montant: Number(t.montant),
                    sens: t.type === 'revenu' ? 'revenu' : 'depense',
                });
            });
        // Calculer le jour d'affichage : depuis jour_recurrence ou la date réelle
        const jour = t.jour_recurrence
            ? Number(t.jour_recurrence)
            : new Date(t.date + 'T12:00:00').getDate();

        if (!jour || jour < 1 || jour > 31) return;

        // Éviter les doublons : si source = dette_auto, ne pas afficher aussi via la liste dettes ci-dessous
        const estDetteAuto = t.source === 'dette_auto';
        const estLoyerAuto = t.source === 'loyer_auto';

        ajouter(jour, {
            type: estDetteAuto ? 'dette_auto' : estLoyerAuto ? 'loyer' : `transaction_${t.type}`,
            nom: t.description || t.categories?.nom || 'Transaction',
            montant: Number(t.montant),
            sens: t.type === 'revenu' ? 'revenu' : 'depense',
        });
    });

    // 2. Abonnements suivis (table abonnements_suivi)
    abonnements.forEach((ab) => {
        if (!ab.date_prochain_prelevement) return;
        const jour = new Date(ab.date_prochain_prelevement + 'T12:00:00').getDate();
        ajouter(jour, {
            type: 'abonnement',
            nom: ab.nom_abonnement,
            montant: Number(ab.montant),
            sens: 'depense',
            resiliation: ab.resiliation_planifiee,
        });
    });

    // 3. Dettes sans remboursement_automatique (non générées en transaction)
    //    Les dettes avec rembourse_automatiquement = true sont déjà dans les transactions
    dettes
        .filter((d) => !d.estRembourse && d.date_debut && !d.rembourse_automatiquement)
        .forEach((d) => {
            const jour = new Date(d.date_debut + 'T12:00:00').getDate();
            ajouter(jour, {
                type: 'credit',
                nom: d.nom,
                montant: Number(d.mensualite),
                sens: 'depense',
            });
        });

    return map;
}, [transactions, abonnements, dettes]);

const grille = useMemo(() => {
    const premierJour = new Date(annee, mois - 1, 1);
    const joursDansMois = new Date(annee, mois, 0).getDate();
    let decalage = premierJour.getDay() - 1;
    if (decalage < 0) decalage = 6;

    const cases = [];
    for (let i = 0; i < decalage; i++) cases.push(null);
    for (let jour = 1; jour <= joursDansMois; jour++) cases.push(jour);
    return cases;
}, [mois, annee]);

const aujourdHui = new Date();
const estMoisActuel = aujourdHui.getMonth() + 1 === mois && aujourdHui.getFullYear() === annee;

const totalMensuelEcheances = Object.values(echeancesParJour)
    .flat()
    // dédupliquer : ne pas compter les dettes déjà en transaction ET en dette manuelle
    .reduce((s, item) => s + (item.sens === 'revenu' ? item.montant : -item.montant), 0);

const getBadgeColor = (type) => BADGE_COLOR[type] || 'bg-slate-400';
console.log('DEBUG calendrier', {
    nbTransactionsRecurrentes: transactions.filter(t => t.recurrente).length,
    nbAbonnements: abonnements.length,
    nbDettesActives: dettes.filter(d => !d.estRembourse).length,
});
return (
    <div className="bg-card rounded-2xl border border-[var(--border)] p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-[var(--text-h)] font-semibold">📅 Échéances récurrentes du mois</h3>
            <span className="text-xs text-[var(--text)]">
                Impact net :{' '}
                <span className={`font-semibold ${totalMensuelEcheances >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {incognito ? '••••' : formatMontant(totalMensuelEcheances)}
                </span>
            </span>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-[var(--text)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Dépense récurrente</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Revenu récurrent</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Abonnement</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Loyer perçu</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Mensualité crédit</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Crédit (manuel)</span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
            {JOURS_SEMAINE.map((j) => (
                <div key={j} className="text-center text-[11px] font-medium text-[var(--text)] py-1">
                    {j}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
            {grille.map((jour, idx) => {
                if (jour === null) return <div key={`vide-${idx}`} className="aspect-square" />;

                const echeances = echeancesParJour[jour] || [];
                const aDesEcheances = echeances.length > 0;
                const estAujourdHui = estMoisActuel && aujourdHui.getDate() === jour;

                return (
                    <div
                        key={jour}
                        onMouseEnter={() => aDesEcheances && setJourSurvole(jour)}
                        onMouseLeave={() => setJourSurvole(null)}
                        className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-default transition
                                ${estAujourdHui ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-h)] hover:bg-surface'}
                                ${aDesEcheances && !estAujourdHui ? 'bg-surface/60 border border-[var(--border)]' : ''}
                            `}
                    >
                        <span>{jour}</span>
                        {aDesEcheances && (
                            <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                {echeances.slice(0, 3).map((item, i) => (
                                    <span
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${estAujourdHui ? 'bg-white' : getBadgeColor(item.type)}`}
                                    />
                                ))}
                            </div>
                        )}

                        {jourSurvole === jour && aDesEcheances && (
                            <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--card-bg,#0f1629)] border border-[var(--border)] text-[var(--text-h)] text-xs rounded-lg shadow-xl p-3 w-64 text-left">
                                <p className="font-semibold mb-1.5 text-[var(--text-h)]">Le {jour} du mois</p>
                                {echeances.map((item, i) => (
                                    <div key={i} className="flex justify-between gap-2 py-0.5">
                                        <span className="truncate text-[var(--text)] flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBadgeColor(item.type)}`} />
                                            {item.nom}
                                            {item.resiliation && (
                                                <span className="text-red-400 text-[10px]">(résilié)</span>
                                            )}
                                        </span>
                                        <span className={item.sens === 'revenu' ? 'text-emerald-400 font-medium shrink-0' : 'text-red-400 font-medium shrink-0'}>
                                            {item.sens === 'revenu' ? '+' : '-'}
                                            {incognito ? '••••' : formatMontant(item.montant)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {Object.keys(echeancesParJour).length === 0 && (
            <p className="text-center text-[var(--text)] text-xs mt-4">
                Aucune échéance récurrente ce mois-ci. Coche « récurrente » sur une
                transaction, ajoute un abonnement, ou renseigne un crédit.
            </p>
        )}
    </div>
);
}