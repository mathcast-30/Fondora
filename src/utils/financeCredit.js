// src/utils/financeCredit.js

/**
 * Calcule la mensualité amortissable classique (formule standard).
 */
export function calculerMensualiteCredit(montant, tauxAnnuel, dureeMois) {
    if (!montant || !dureeMois) return 0;
    const tauxMensuel = (tauxAnnuel || 0) / 100 / 12;
    if (tauxMensuel === 0) return montant / dureeMois;
    return (montant * tauxMensuel * Math.pow(1 + tauxMensuel, dureeMois)) /
        (Math.pow(1 + tauxMensuel, dureeMois) - 1);
}

/**
 * Génère le tableau d'amortissement complet d'un crédit.
 * Gère 4 types :
 *  - classique       : amortissable standard sur toute la durée
 *  - differe_partiel : intérêts seuls pendant duree_differe_mois, puis amortissement classique
 *  - differe_total    : ni capital ni intérêts payés pendant duree_differe_mois
 *                        (intérêts capitalisés au capital restant dû), puis amortissement classique
 *  - in_fine          : intérêts seuls sur toute la durée, capital remboursé en un seul bloc
 *                        à la dernière échéance
 *
 * Pour differe_partiel / differe_total / in_fine, la mensualité est recalculée en interne
 * à chaque phase — le paramètre `mensualite` n'est utilisé QUE pour le type 'classique'
 * (permet de respecter une mensualité éventuellement arrondie/négociée par la banque).
 *
 * Retourne un tableau de 'duree_mois' lignes, chacune avec un champ `phase` :
 *   'classique' | 'differe_partiel' | 'differe_total' | 'interets_seuls' | 'solde_final'
 */
export function genererTableauAmortissement({
    capitalEmprunte,
    tauxInteret,      // en pourcentage annuel, ex: 3.5
    dureeMois,
    mensualite,
    dateDebut,        // string ISO "2023-06-01" ou objet Date
    typeAmortissement = 'classique',
    dureeDiffereMois = 0,
}) {
    const tauxMensuel = (tauxInteret || 0) / 100 / 12;
    const debut = new Date(dateDebut);
    const tableau = [];

    const dateAMois = (mois) => {
        const d = new Date(debut);
        d.setMonth(debut.getMonth() + mois);
        return d.toISOString().split('T')[0];
    };

    // ─── IN FINE ────────────────────────────────────────────────────────────
    if (typeAmortissement === 'in_fine') {
        let capitalRestant = capitalEmprunte;
        const mensualiteInterets = Math.round(capitalEmprunte * tauxMensuel * 100) / 100;

        for (let mois = 1; mois <= dureeMois; mois++) {
            const derniereEcheance = mois === dureeMois;
            const interetsMois = Math.round(capitalRestant * tauxMensuel * 100) / 100;
            const amortissementMois = derniereEcheance ? capitalRestant : 0;
            const mensualiteMois = derniereEcheance
                ? Math.round((interetsMois + amortissementMois) * 100) / 100
                : mensualiteInterets;

            capitalRestant = Math.max(0, Math.round((capitalRestant - amortissementMois) * 100) / 100);

            tableau.push({
                mois,
                date: dateAMois(mois),
                mensualite: mensualiteMois,
                interets: interetsMois,
                amortissement: amortissementMois,
                capitalRestant,
                phase: derniereEcheance ? 'solde_final' : 'interets_seuls',
            });
        }
        return tableau;
    }

    // ─── DIFFÉRÉ TOTAL ──────────────────────────────────────────────────────
    if (typeAmortissement === 'differe_total') {
        let capitalRestant = capitalEmprunte;
        const D = Math.min(dureeDiffereMois || 0, dureeMois);

        // Phase 1 : aucune mensualité payée, intérêts capitalisés au capital
        for (let mois = 1; mois <= D; mois++) {
            const interetsMois = Math.round(capitalRestant * tauxMensuel * 100) / 100;
            capitalRestant = Math.round((capitalRestant + interetsMois) * 100) / 100;
            tableau.push({
                mois,
                date: dateAMois(mois),
                mensualite: 0,
                interets: interetsMois,
                amortissement: -interetsMois, // le capital augmente pendant cette phase
                capitalRestant,
                phase: 'differe_total',
            });
        }

        // Phase 2 : amortissement classique sur le capital augmenté
        const dureeRestante = dureeMois - D;
        const mensualitePhase2 = dureeRestante > 0
            ? calculerMensualiteCredit(capitalRestant, tauxInteret, dureeRestante)
            : 0;

        for (let i = 1; i <= dureeRestante; i++) {
            const mois = D + i;
            const interetsMois = capitalRestant * tauxMensuel;
            const amortissementMois = mensualitePhase2 - interetsMois;
            capitalRestant = Math.max(0, capitalRestant - amortissementMois);
            tableau.push({
                mois,
                date: dateAMois(mois),
                mensualite: Math.round(mensualitePhase2 * 100) / 100,
                interets: Math.round(interetsMois * 100) / 100,
                amortissement: Math.round(amortissementMois * 100) / 100,
                capitalRestant: Math.round(capitalRestant * 100) / 100,
                phase: 'classique',
            });
        }
        return tableau;
    }

    // ─── DIFFÉRÉ PARTIEL ────────────────────────────────────────────────────
    if (typeAmortissement === 'differe_partiel') {
        let capitalRestant = capitalEmprunte;
        const D = Math.min(dureeDiffereMois || 0, dureeMois);

        // Phase 1 : intérêts seuls, capital inchangé
        for (let mois = 1; mois <= D; mois++) {
            const interetsMois = Math.round(capitalRestant * tauxMensuel * 100) / 100;
            tableau.push({
                mois,
                date: dateAMois(mois),
                mensualite: interetsMois,
                interets: interetsMois,
                amortissement: 0,
                capitalRestant,
                phase: 'differe_partiel',
            });
        }

        // Phase 2 : amortissement classique
        const dureeRestante = dureeMois - D;
        const mensualitePhase2 = dureeRestante > 0
            ? calculerMensualiteCredit(capitalRestant, tauxInteret, dureeRestante)
            : 0;

        for (let i = 1; i <= dureeRestante; i++) {
            const mois = D + i;
            const interetsMois = capitalRestant * tauxMensuel;
            const amortissementMois = mensualitePhase2 - interetsMois;
            capitalRestant = Math.max(0, capitalRestant - amortissementMois);
            tableau.push({
                mois,
                date: dateAMois(mois),
                mensualite: Math.round(mensualitePhase2 * 100) / 100,
                interets: Math.round(interetsMois * 100) / 100,
                amortissement: Math.round(amortissementMois * 100) / 100,
                capitalRestant: Math.round(capitalRestant * 100) / 100,
                phase: 'classique',
            });
        }
        return tableau;
    }

    // ─── CLASSIQUE (comportement original, inchangé) ───────────────────────
    let capitalRestant = capitalEmprunte;
    for (let mois = 1; mois <= dureeMois; mois++) {
        const interetsMois = capitalRestant * tauxMensuel;
        const amortissementMois = mensualite - interetsMois;
        capitalRestant = Math.max(0, capitalRestant - amortissementMois);
        tableau.push({
            mois,
            date: dateAMois(mois),
            mensualite,
            interets: Math.round(interetsMois * 100) / 100,
            amortissement: Math.round(amortissementMois * 100) / 100,
            capitalRestant: Math.round(capitalRestant * 100) / 100,
            phase: 'classique',
        });
    }
    return tableau;
}

/**
 * Calcule le Capital Restant Dû (CRD) à aujourd'hui.
 */
export function calculerCRD({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
    typeAmortissement = 'classique',
    dureeDiffereMois = 0,
}) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte, tauxInteret, dureeMois, mensualite, dateDebut,
        typeAmortissement, dureeDiffereMois,
    });

    const aujourd_hui = new Date();
    const debut = new Date(dateDebut);

    const moisEcoules =
        (aujourd_hui.getFullYear() - debut.getFullYear()) * 12 +
        (aujourd_hui.getMonth() - debut.getMonth());

    if (moisEcoules <= 0) return capitalEmprunte;
    if (moisEcoules >= dureeMois) return 0;

    return tableau[moisEcoules - 1].capitalRestant;
}

/**
 * Calcule la mensualité due pour le mois en cours (ou une date cible).
 * Diffère de `mensualite` (champ stocké) dès qu'on est en différé ou en in fine :
 * la vraie mensualité varie selon la phase. Renvoie 0 pendant un différé total.
 */
export function calculerMensualiteCourante(dette, dateCible = new Date()) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte: dette.capital_emprunte,
        tauxInteret: dette.taux_interet,
        dureeMois: dette.duree_mois,
        mensualite: dette.mensualite,
        dateDebut: dette.date_debut,
        typeAmortissement: dette.type_amortissement || 'classique',
        dureeDiffereMois: dette.duree_differe_mois || 0,
    });

    const debut = new Date(dette.date_debut);
    const cible = new Date(dateCible);
    const moisEcoules =
        (cible.getFullYear() - debut.getFullYear()) * 12 +
        (cible.getMonth() - debut.getMonth());

    if (moisEcoules < 0 || moisEcoules >= dette.duree_mois) return 0;
    return tableau[moisEcoules].mensualite;
}

/**
 * Calcule le pourcentage de remboursement du capital (0 à 100).
 */
export function calculerProgressionRemboursement({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
    typeAmortissement = 'classique',
    dureeDiffereMois = 0,
}) {
    const crd = calculerCRD({
        capitalEmprunte, tauxInteret, dureeMois, mensualite, dateDebut,
        typeAmortissement, dureeDiffereMois,
    });
    // En différé total le capital peut être temporairement > capital initial
    // (intérêts capitalisés) : on plafonne la progression à 0 dans ce cas plutôt
    // qu'un pourcentage négatif qui n'aurait pas de sens à l'affichage.
    const capitalRembourse = capitalEmprunte - crd;
    return Math.max(0, Math.min(100, Math.round((capitalRembourse / capitalEmprunte) * 100)));
}

/**
 * Retourne la date de fin estimée du crédit (identique pour tous les types :
 * duree_mois couvre déjà la totalité, différé et in fine inclus).
 */
export function calculerDateFin({ dateDebut, dureeMois }) {
    const fin = new Date(dateDebut);
    fin.setMonth(fin.getMonth() + dureeMois);
    return fin;
}

/**
 * Calcule les intérêts totaux payés sur toute la durée du crédit.
 * Recalculé à partir du tableau complet (nécessaire dès qu'il y a différé/in fine,
 * la mensualité n'étant plus constante).
 */
export function calculerCoutTotalCredit({
    capitalEmprunte,
    tauxInteret,
    dureeMois,
    mensualite,
    dateDebut,
    typeAmortissement = 'classique',
    dureeDiffereMois = 0,
}) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte, tauxInteret, dureeMois, mensualite, dateDebut,
        typeAmortissement, dureeDiffereMois,
    });
    const totalInterets = tableau.reduce((s, ligne) => s + ligne.interets, 0);
    return Math.round(totalInterets * 100) / 100;
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
    typeAmortissement = 'classique',
    dureeDiffereMois = 0,
}) {
    const tableau = genererTableauAmortissement({
        capitalEmprunte, tauxInteret, dureeMois, mensualite, dateDebut,
        typeAmortissement, dureeDiffereMois,
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