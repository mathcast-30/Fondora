import { useMemo, useState } from 'react';
import { useIncognito } from '../../context/IncognitoContext';

function jourDepuisDateISO(dateStr) {
    if (!dateStr) return null;
    const partie = String(dateStr).split('T')[0]; // au cas où il y aurait une heure collée
    const morceaux = partie.split('-');
    if (morceaux.length < 3) return null;
    return parseInt(morceaux[2], 10);
}

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const BADGE_COLOR = {
    transaction: 'bg-emerald',
    abonnement: 'bg-indigo-400',
    credit: 'bg-amber-400',
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

        transactions
            .filter((t) => t.recurrente && t.recurrence_active !== false)
            .forEach((t) => {
                const jour = t.jour_recurrence || jourDepuisDateISO(t.date);
                ajouter(jour, {
                    type: 'transaction',
                    nom: t.description || t.categories?.nom || 'Transaction',
                    montant: Number(t.montant),
                    sens: t.type === 'revenu' ? 'revenu' : 'depense',
                });
            });

        abonnements.forEach((ab) => {
            if (!ab.date_prochain_prelevement) return;
            const jour = jourDepuisDateISO(ab.date_prochain_prelevement);
            ajouter(jour, {
                type: 'abonnement',
                nom: ab.nom_abonnement,
                montant: Number(ab.montant),
                sens: 'depense',
                resiliation: ab.resiliation_planifiee,
            });
        });

        dettes.forEach((d) => {
            if (d.estRembourse || !d.date_debut) return;
            const jour = jourDepuisDateISO(d.date_debut);
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
        .reduce((s, item) => s + (item.sens === 'revenu' ? item.montant : -item.montant), 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-navy font-semibold">📅 Échéances récurrentes du mois</h3>
                <span className="text-xs text-slate-400">
                    Impact net :{' '}
                    <span className={`font-semibold ${totalMensuelEcheances >= 0 ? 'text-emerald' : 'text-red-500'}`}>
                        {incognito ? '••••' : formatMontant(totalMensuelEcheances)}
                    </span>
                </span>
            </div>

            <div className="flex gap-4 mb-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald inline-block" /> Transaction</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Abonnement</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Crédit</span>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {JOURS_SEMAINE.map((j) => (
                    <div key={j} className="text-center text-[11px] font-medium text-slate-400 py-1">
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
                            className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-default transition ${estAujourdHui
                                ? 'bg-navy text-white font-bold'
                                : 'text-slate-600 hover:bg-gray-50'
                                } ${aDesEcheances && !estAujourdHui ? 'bg-emerald/5 border border-emerald/20' : ''}`}
                        >
                            <span>{jour}</span>
                            {aDesEcheances && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {echeances.slice(0, 3).map((item, i) => (
                                        <span
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${estAujourdHui ? 'bg-white' : BADGE_COLOR[item.type]
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {jourSurvole === jour && aDesEcheances && (
                                <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-navy text-white text-xs rounded-lg shadow-lg p-3 w-60 text-left">
                                    <p className="font-semibold mb-1.5">Le {jour} du mois</p>
                                    {echeances.map((item, i) => (
                                        <div key={i} className="flex justify-between gap-2 py-0.5">
                                            <span className="truncate text-gray-300 flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BADGE_COLOR[item.type]}`} />
                                                {item.nom}
                                                {item.resiliation && (
                                                    <span className="text-red-300 text-[10px]">(résilié)</span>
                                                )}
                                            </span>
                                            <span
                                                className={
                                                    item.sens === 'revenu'
                                                        ? 'text-emerald-light font-medium shrink-0'
                                                        : 'text-red-300 font-medium shrink-0'
                                                }
                                            >
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
                <p className="text-center text-slate-400 text-xs mt-4">
                    Aucune échéance récurrente ce mois-ci. Coche « récurrente » sur une
                    transaction, ajoute un abonnement, ou renseigne un crédit.
                </p>
            )}
        </div>
    );
}