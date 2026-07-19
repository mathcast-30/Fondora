/**
 * Calcule le "Restant à Vivre" réel en soustrayant les charges futures du mois.
 * @param {object} params
 * @param {number} params.soldeComptesCourants - Solde total des comptes courants
 * @param {Array}  params.depensesRecurrentes  - [{jour_prelevement, montant}]
 * @param {number} params.objectifsEpargneMois - Montant mis de côté pour l'épargne
 */
export function calculerRestantAVivre({
    soldeComptesCourants = 0,
    depensesRecurrentes = [],
    objectifsEpargneMois = 0,
}) {
    const date = new Date()
    const jourActuel = date.getDate()
    const dernierJourDuMois = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

    const depensesAvenir = depensesRecurrentes
        .filter(dep => Number(dep.jour_prelevement) > jourActuel)
        .reduce((sum, dep) => sum + Math.abs(Number(dep.montant)), 0)

    const restantAVivreReel = soldeComptesCourants - depensesAvenir - objectifsEpargneMois

    const joursRestants = Math.max(1, dernierJourDuMois - jourActuel)
    const budgetQuotidienConseille = Math.max(0, restantAVivreReel / joursRestants)

    return { restantAVivreReel, depensesAvenir, budgetQuotidienConseille, joursRestants }
}

/**
 * Simule l'impact d'une économie mensuelle placée sur plusieurs horizons (intérêts composés).
 */
export function calculerImpactWhatIf(economieMensuelle, tauxRendementAnnuel = 0.07, inflation = 0.02) {
    const horizons = [5, 10, 20, 30]
    const resultats = {}
    const tauxReel = tauxRendementAnnuel - inflation

    horizons.forEach(ans => {
        const mois = ans * 12
        let capital
        if (tauxReel <= 0) {
            capital = economieMensuelle * mois
        } else {
            const tauxMensuel = tauxReel / 12
            capital = economieMensuelle * ((Math.pow(1 + tauxMensuel, mois) - 1) / tauxMensuel)
        }
        resultats[`ans_${ans}`] = Math.round(capital)
    })

    return resultats
}

/**
 * Détecte les abonnements et frais bancaires dans une liste de transactions.
 */
export function detecterAbonnementsEtFrais(transactions = []) {
    const abonnementsDetectes = []
    const fraisBancairesDetectes = []

    const MOTS_FRAIS = [
        'AGIOS', 'FRAIS DE TENUE DE COMPTE', 'COMMISSION D INTERVENTION',
        'COTISATION CARTE', 'FRAIS BANCAIRES', 'INTERETS DEBITEURS',
        'FRAIS DE VIREMENT', 'FRAIS CARTE',
    ]

    const MOTS_ABONNEMENTS = [
        'NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'DEEZER', 'CANAL+', 'DISNEYPLUS',
        'GYM', 'BASIC FIT', 'ICLOUD', 'APPLE', 'YOUTUBE', 'TWITCH',
        'PLAYSTATION', 'XBOX', 'HULU', 'PARAMOUNT', 'DISNEY',
    ]

    transactions.forEach(t => {
        const desc = (t.description || '').toUpperCase()
        const montant = Math.abs(Number(t.montant))
        const estDepense = Number(t.montant) < 0 || t.type === 'depense'

        if (!estDepense) return

        if (MOTS_FRAIS.some(mot => desc.includes(mot))) {
            fraisBancairesDetectes.push({ id: t.id, date: t.date, libelle: t.description, montant })
        }
        if (MOTS_ABONNEMENTS.some(mot => desc.includes(mot))) {
            abonnementsDetectes.push({ nom: t.description, montant, date: t.date })
        }
    })

    return { abonnementsDetectes, fraisBancairesDetectes }
}