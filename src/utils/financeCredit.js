// src/utils/financeCredit.js

/**
 * Génère le tableau d'amortissement complet d'un crédit.
 * Retourne un tableau de 'duree_mois' lignes.
 */
export function genererTableauAmortissement({
    capitalEmprunte,
    tauxInteret,      // en pourcentage annuel, ex: 3.5
    dureeMois,
    mensualite,
    dateDebut,        // string ISO "2023-06-01" ou objet Date
}) {
    const tauxMensuel = tauxInteret / 100 / 12;
    let capitalRestant = capitalEmprunte;
    const debut = new Date(dateDebut);
    const tableau = [];

    for (let mois = 1; mois <= dureeMois; mois++) {
        const interetsMois = capitalRestant * tauxMensuel;
        const amortissementMois = mensualite - interetsMois;
        capitalRestant = Math.max(0, capitalRestant - amortissementMois);

        const datePaiement = new Date(debut);
        datePaiement.setMonth(debut.getMonth() + mois);

        tableau.push({
            mois,
            date: datePaiement.toISOString().split('T')[0],
            mensualite,
            interets: Math.round(interetsMois * 100) / 100,
            amortissement: Math.round(amortissementMois * 100) / 100,
            capitalRestant: Math.round(capitalRestant * 100) / 100,
        });
    }

    return tableau;
}

/**
 * Calcule le Capital Restant Dû (CRD) à aujourd'hui.
 * Fonction principale utilisée dans les cartes UI.
 */
export function calculerCRD({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
}) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte,
        tauxInteret,
        dureeMois,
        mensualite,
        dateDebut,
    });

    const aujourd_hui = new Date();
    const debut = new Date(dateDebut);

    // Nombre de mois écoulés depuis le début
    const moisEcoules =
        (aujourd_hui.getFullYear() - debut.getFullYear()) * 12 +
        (aujourd_hui.getMonth() - debut.getMonth());

    if (moisEcoules <= 0) return capitalEmprunte;
    if (moisEcoules >= dureeMois) return 0;

    return tableau[moisEcoules - 1].capitalRestant;
}

/**
 * Calcule le pourcentage de remboursement (0 à 100).
 * Utilisé pour la barre de progression dans DetteCard.
 */
export function calculerProgressionRemboursement({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
}) {
    const crd = calculerCRD({
        capitalEmprunte,
        tauxInteret,
        dureeMois,
        mensualite,
        dateDebut,
    });
    const capitalRembourse = capitalEmprunte - crd;
    return Math.min(100, Math.round((capitalRembourse / capitalEmprunte) * 100));
}

/**
 * Retourne la date de fin estimée du crédit.
 */
export function calculerDateFin({ dateDebut, dureeMois }) {
    const fin = new Date(dateDebut);
    fin.setMonth(fin.getMonth() + dureeMois);
    return fin;
}

/**
 * Calcule les intérêts totaux payés sur toute la durée.
 */
export function calculerCoutTotalCredit({ mensualite, dureeMois, capitalEmprunte }) {
    return Math.round((mensualite * dureeMois - capitalEmprunte) * 100) / 100;
}

/**
 * Pour les projections (étape 16) :
 * Retourne le CRD à une date future donnée.
 */
export function calculerCRDaDate({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
    dateCible, // string ISO ou Date
}) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte, tauxInteret, dureeMois, mensualite, dateDebut,
    });

    const debut = new Date(dateDebut);
    const cible = new Date(dateCible);

    const moisEcoules =
        (cible.getFullYear() - debut.getFullYear()) * 12 +
        (cible.getMonth() - debut.getMonth());

    if (moisEcoules <= 0) return capitalEmprunte;
    if (moisEcoules >= dureeMois) return 0;

    return tableau[moisEcoules - 1].capitalRestant;
}