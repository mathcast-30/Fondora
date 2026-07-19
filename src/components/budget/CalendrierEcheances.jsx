import { useMemo, useState } from 'react';
import { useIncognito } from '../../context/IncognitoContext';

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendrierEcheances({ mois, annee, transactions = [] }) {
    const { incognito } = useIncognito();
    const [jourSurvole, setJourSurvole] = useState(null);

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    // Regroupe les transactions récurrentes par jour du mois
    const echeancesParJour = useMemo(() => {
        const map = {};
        transactions
            .filter((t) => t.recurrente)
            .forEach((t) => {
                const jour = new Date(t.date).getDate();
                if (!map[jour]) map[jour] = [];
                map[jour].push(t);
            });
        return map;
    }, [transactions]);

    // Grille du mois alignée sur Lundi
    const grille = useMemo(() => {
        const premierJour = new Date(annee, mois - 1, 1);
        const joursDansMois = new Date(annee, mois, 0).getDate();
        let decalage = premierJour.getDay() - 1; // getDay(): 0 = dimanche
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
        .reduce((s, t) => s + Number(t.montant), 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-navy font-semibold">📅 Échéances récurrentes du mois</h3>
                <span className="text-xs text-slate-400">
                    Total :{' '}
                    <span className="font-semibold text-slate-600">
                        {incognito ? '••••' : formatMontant(totalMensuelEcheances)}
                    </span>
                </span>
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
                                    {echeances.slice(0, 3).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${estAujourdHui ? 'bg-white' : 'bg-emerald'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {jourSurvole === jour && aDesEcheances && (
                                <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-navy text-white text-xs rounded-lg shadow-lg p-3 w-56 text-left">
                                    <p className="font-semibold mb-1.5">Le {jour} du mois</p>
                                    {echeances.map((t, i) => (
                                        <div key={i} className="flex justify-between gap-2 py-0.5">
                                            <span className="truncate text-gray-300">
                                                {t.description || t.categories?.nom || 'Sans nom'}
                                            </span>
                                            <span
                                                className={
                                                    t.type === 'revenu'
                                                        ? 'text-emerald-light font-medium'
                                                        : 'text-red-300 font-medium'
                                                }
                                            >
                                                {t.type === 'revenu' ? '+' : '-'}
                                                {incognito ? '••••' : formatMontant(t.montant)}
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
                    Aucune échéance récurrente ce mois-ci. Coche « récurrente » en ajoutant une
                    transaction, ou lors d'un import CSV.
                </p>
            )}
        </div>
    );
}