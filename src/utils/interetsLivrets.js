// Moteur de calcul des intérêts pour les livrets réglementés (Livret A, LDDS, LEP, Livret Jeune)
// selon la règle légale des "quinzaines" (Code Monétaire et Financier) :
//   - Un versement commence à produire des intérêts à la prochaine date de valeur (le 1er ou le 16 du mois).
//   - Un retrait cesse de produire des intérêts dès le début de la quinzaine en cours.
//   - Les intérêts sont calculés par quinzaine : solde productif x (taux annuel / 24), puis cumulés sur l'année.
//   - Ils sont crédités en une fois, le 31 décembre (valeur 1er janvier).

/**
 * Date de valeur d'un VERSEMENT : le dépôt commence à rapporter à la quinzaine suivante.
 */
export function dateValeurVersement(date) {
    const d = new Date(date);
    const jour = d.getDate();
    if (jour <= 15) {
        return new Date(d.getFullYear(), d.getMonth(), 16);
    }
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

/**
 * Date de valeur d'un RETRAIT : le retrait fait perdre les intérêts depuis le début
 * de la quinzaine en cours (on recule à la borne précédente).
 */
export function dateValeurRetrait(date) {
    const d = new Date(date);
    const jour = d.getDate();
    if (jour <= 15) {
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(d.getFullYear(), d.getMonth(), 16);
}

/**
 * Génère les 24 quinzaines (dates de début/fin) d'une année civile.
 */
function genererQuinzaines(annee) {
    const quinzaines = [];
    for (let mois = 0; mois < 12; mois++) {
        quinzaines.push({ debut: new Date(annee, mois, 1), fin: new Date(annee, mois, 15) });
        const finMois = new Date(annee, mois + 1, 0).getDate(); // dernier jour du mois
        quinzaines.push({ debut: new Date(annee, mois, 16), fin: new Date(annee, mois, finMois) });
    }
    return quinzaines;
}

/**
 * Taux annuel (%) applicable à une date, à partir d'un historique [{ taux, date_effet: 'YYYY-MM-DD' }].
 */
function tauxApplicable(date, historiqueTaux) {
    const dateStr = date.toISOString().split('T')[0];
    const applicables = historiqueTaux
        .filter(t => t.date_effet <= dateStr)
        .sort((a, b) => (a.date_effet < b.date_effet ? 1 : -1));
    if (applicables.length === 0) return 0;
    return parseFloat(applicables[0].taux);
}

/**
 * Calcule les intérêts annuels d'un livret réglementé selon la règle des quinzaines.
 *
 * @param {Object} params
 * @param {number} params.annee - Année civile à calculer (ex: 2026)
 * @param {number} params.soldeDebutAnnee - Solde du compte au 1er janvier de l'année
 * @param {Array}  params.transactions - [{ date: 'YYYY-MM-DD', montant: number }] montant > 0 = versement, < 0 = retrait
 * @param {Array}  params.historiqueTaux - [{ taux: number, date_effet: 'YYYY-MM-DD' }]
 * @param {string} [params.dateOuvertureCompte] - Si ouvert en cours d'année, ignore les quinzaines antérieures
 *
 * @returns {{ montantInterets: number, tauxMoyenPondere: number, detailQuinzaines: Array }}
 */
export function calculerInteretsLivret({
    annee,
    soldeDebutAnnee,
    transactions = [],
    historiqueTaux = [],
    dateOuvertureCompte = null,
}) {
    const quinzaines = genererQuinzaines(annee);

    // Convertit chaque transaction en événement daté à sa date de valeur (pas sa date réelle)
    const evenements = transactions.map(t => {
        const dateOriginale = new Date(t.date);
        const dateValeur = t.montant >= 0
            ? dateValeurVersement(dateOriginale)
            : dateValeurRetrait(dateOriginale);
        return { dateValeur, delta: t.montant };
    });

    // Les versements de fin décembre ont une valeur au 1er janvier N+1 : aucun intérêt cette année
    const evenementsDansAnnee = evenements.filter(e => e.dateValeur.getFullYear() === annee);

    const dateOuverture = dateOuvertureCompte ? new Date(dateOuvertureCompte) : null;

    let montantTotal = 0;
    let sommeTauxPonderee = 0;
    const detailQuinzaines = [];

    for (const q of quinzaines) {
        // Compte pas encore ouvert pendant cette quinzaine -> ignorée
        if (dateOuverture && q.fin < dateOuverture) continue;

        const soldeProductifBrut = soldeDebutAnnee + evenementsDansAnnee
            .filter(e => e.dateValeur <= q.debut)
            .reduce((sum, e) => sum + e.delta, 0);

        const soldeProductif = Math.max(0, soldeProductifBrut); // jamais négatif
        const taux = tauxApplicable(q.debut, historiqueTaux);
        const interetQuinzaine = (soldeProductif * (taux / 100)) / 24;

        montantTotal += interetQuinzaine;
        sommeTauxPonderee += taux * soldeProductif;

        detailQuinzaines.push({
            periode: `${q.debut.toISOString().split('T')[0]} au ${q.fin.toISOString().split('T')[0]}`,
            soldeProductif: Math.round(soldeProductif * 100) / 100,
            taux,
            interet: Math.round(interetQuinzaine * 100) / 100,
        });
    }

    const sommeSoldes = detailQuinzaines.reduce((s, q) => s + q.soldeProductif, 0);
    const tauxMoyenPondere = sommeSoldes > 0 ? sommeTauxPonderee / sommeSoldes : 0;

    return {
        montantInterets: Math.round(montantTotal * 100) / 100,
        tauxMoyenPondere: Math.round(tauxMoyenPondere * 10000) / 10000,
        detailQuinzaines,
    };
}