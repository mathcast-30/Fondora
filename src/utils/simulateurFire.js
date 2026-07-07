// src/utils/simulateurFire.js
import { calculerCRDaDate } from './financeCredit';

export function simulerTrajectoire({ dettes, epargneMensuelle, /* ... */ }) {

    // Pour chaque année simulée
    for (let annee = 0; annee < horizonAns; annee++) {
        const dateCible = new Date();
        dateCible.setFullYear(dateCible.getFullYear() + annee);

        // Calcul des mensualités actives cette année-là
        const mensualitesAnnee = dettes.reduce((total, dette) => {
            const crdCibleAnnee = calculerCRDaDate({
                ...dette,
                capitalEmprunte: dette.capital_emprunte,
                tauxInteret: dette.taux_interet,
                dureeMois: dette.duree_mois,
                mensualite: dette.mensualite,
                dateDebut: dette.date_debut,
                dateCible,
            });

            // Si le CRD est 0, le crédit est fini → mensualité libérée !
            return crdCibleAnnee > 0 ? total + dette.mensualite : total;
        }, 0);

        // La capacité d'épargne augmente automatiquement quand un crédit se termine
        const capaciteEpargne = epargneMensuelle + mensualitesPrecedentes - mensualitesAnnee;

        // ... suite de la simulation
    }
}