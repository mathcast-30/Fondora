// Calcule le capital restant dû après N mois de remboursement
export function calculCapitalRestantDu(montant, tauxAnnuel, dureeMois, moisEcoules) {
    if (!montant || !tauxAnnuel || !dureeMois || moisEcoules <= 0) return montant || 0
    const tauxMensuel = tauxAnnuel / 100 / 12
    if (tauxMensuel === 0) return Math.max(0, montant - (montant / dureeMois) * moisEcoules)
    const mensualite = (montant * tauxMensuel * Math.pow(1 + tauxMensuel, dureeMois)) /
        (Math.pow(1 + tauxMensuel, dureeMois) - 1)
    const capitalRestant = montant * Math.pow(1 + tauxMensuel, moisEcoules) -
        mensualite * (Math.pow(1 + tauxMensuel, moisEcoules) - 1) / tauxMensuel
    return Math.max(0, capitalRestant)
}

export function calculerMensualiteCredit(montant, tauxAnnuel, dureeMois) {
    if (!montant || !tauxAnnuel || !dureeMois) return 0
    const tauxMensuel = tauxAnnuel / 100 / 12
    if (tauxMensuel === 0) return montant / dureeMois
    return (montant * tauxMensuel * Math.pow(1 + tauxMensuel, dureeMois)) /
        (Math.pow(1 + tauxMensuel, dureeMois) - 1)
}

export function calculerRentabilite(bien) {
    const loyerAnnuelBrut = (bien.loyer_mensuel || 0) * 12
    const loyerAnnuelNet = loyerAnnuelBrut * (1 - (bien.taux_vacance || 0) / 100)

    const chargesAnnuelles =
        (bien.assurance_emprunteur_annuelle || 0) +
        (bien.taxe_fonciere_annuelle || 0) +
        (bien.charges_copropriete_annuelle || 0) +
        (bien.assurance_habitation_annuelle || 0) +
        (bien.frais_gestion_annuelle || 0) +
        (bien.travaux_annuels || 0)

    const mensualiteCredit = bien.mensualite_credit ||
        calculerMensualiteCredit(bien.montant_credit, bien.taux_credit, bien.duree_credit_mois)

    // Capital restant dû réel basé sur la date d'achat
    const moisEcoules = bien.date_achat
        ? Math.floor((Date.now() - new Date(bien.date_achat).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0
    const capitalRestantDu = bien.montant_credit
        ? calculCapitalRestantDu(bien.montant_credit, bien.taux_credit, bien.duree_credit_mois, moisEcoules)
        : 0

    const rentabiliteBrute = bien.prix_achat > 0 ? (loyerAnnuelBrut / bien.prix_achat) * 100 : 0
    const rentabiliteNette = bien.prix_achat > 0
        ? ((loyerAnnuelNet - chargesAnnuelles) / bien.prix_achat) * 100 : 0

    const chargesAnnuellesTotal = chargesAnnuelles + mensualiteCredit * 12
    const cashFlowMensuel = (loyerAnnuelNet / 12) - (chargesAnnuellesTotal / 12)
    const plusValue = (bien.valeur_actuelle || 0) - (bien.prix_achat || 0)
    const valeurNette = (bien.valeur_actuelle || 0) - capitalRestantDu

    return {
        loyerAnnuelBrut,
        loyerAnnuelNet,
        chargesAnnuelles,
        mensualiteCredit,
        cashFlowMensuel,
        rentabiliteBrute,
        rentabiliteNette,
        plusValue,
        valeurNette,
        capitalRestantDu,
        moisEcoules,
    }
}