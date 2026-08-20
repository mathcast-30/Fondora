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
 * Génère les 24 quinzaines (dates de début/fin en YYYY-MM-DD) d'une année civile.
 */
export function getQuinzaines(annee) {
  const quinzaines = [];
  for (let mois = 0; mois < 12; mois++) {
    const mm = String(mois + 1).padStart(2, '0');
    quinzaines.push({
      debut: `${annee}-${mm}-01`,
      fin: `${annee}-${mm}-15`,
    });
    const dernierJour = new Date(annee, mois + 1, 0).getDate();
    quinzaines.push({
      debut: `${annee}-${mm}-16`,
      fin: `${annee}-${mm}-${String(dernierJour).padStart(2, '0')}`,
    });
  }
  return quinzaines;
}

function getTauxApplicable(dateStr, tauxHistorique) {
  const applicables = tauxHistorique
    .filter((t) => t?.date_effet && t.date_effet <= dateStr && !isNaN(Number(t.taux)))
    .sort((a, b) => (a.date_effet < b.date_effet ? 1 : -1));
  return applicables.length > 0 ? Number(applicables[0].taux) : null;
}

export function calculerInteretsLivret({
  soldeInitial = 0,
  dateOuverture,
  transactions = [],
  tauxHistorique = [],
  annee,
}) {
  const quinzaines = getQuinzaines(annee);

  const mouvementsValorises = transactions
    .filter((t) => t?.date >= `${annee}-01-01` && t.date <= `${annee}-12-31` && !isNaN(Number(t.montant)))
    .map((t) => ({ montant: Number(t.montant), dateValeur: getDateValeur(t.date, Number(t.montant)) }));

  const soldeInitialSur = Number(soldeInitial) || 0;
  const soldeDepart = dateOuverture > `${annee}-01-01` ? 0 : soldeInitialSur;

  let montantInterets = 0;
  let sommeInteretsPonderee = 0;
  let sommeSoldesPonderes = 0;
  const detailQuinzaines = [];

  for (const q of quinzaines) {
    if (!dateOuverture || q.fin < dateOuverture) {
      detailQuinzaines.push({ ...q, soldeProductif: 0, taux: null, interet: 0 });
      continue;
    }

    const soldeProductif = mouvementsValorises
      .filter((m) => m.dateValeur <= q.debut)
      .reduce((sum, m) => sum + m.montant, soldeDepart);

    const taux = getTauxApplicable(q.debut, tauxHistorique);
    const base = Math.max(Number.isFinite(soldeProductif) ? soldeProductif : 0, 0);
    const interetQuinzaine = taux != null ? (base * (taux / 100)) / 24 : 0;

    montantInterets += interetQuinzaine;
    if (taux != null) {
      sommeInteretsPonderee += base * taux;
      sommeSoldesPonderes += base;
    }

    detailQuinzaines.push({
      ...q,
      soldeProductif: Math.round(soldeProductif * 100) / 100,
      taux,
      interet: Math.round(interetQuinzaine * 100) / 100,
    });
  }

  return {
    montantInterets: Number.isFinite(montantInterets) ? Math.round(montantInterets * 100) / 100 : 0,
    tauxMoyenPondere:
      sommeSoldesPonderes > 0 && Number.isFinite(sommeInteretsPonderee)
        ? Math.round((sommeInteretsPonderee / sommeSoldesPonderes) * 1000) / 1000
        : null,
    detailQuinzaines,
  };
}

export function getDateValeur(dateStr, montant) {
    const d = new Date(dateStr);
    const dateVal = montant >= 0 ? dateValeurVersement(d) : dateValeurRetrait(d);
    const annee = dateVal.getFullYear();
    const mois = String(dateVal.getMonth() + 1).padStart(2, '0');
    const jour = String(dateVal.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
}

// Exposé séparément pour l'affichage pédagogique dans le simulateur
// (indique à partir de quelle date un mouvement commence/cesse de porter intérêt)
export function getDateValeurPourAffichage(dateStr, montant) {
  return getDateValeur(dateStr, montant)
}