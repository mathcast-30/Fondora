// src/utils/analyserFrais.js
import {
    calculerValeurActuelleContrat,
    calculerTerMoyenPondere,
    calculerFraisAV,
} from '../lib/financialCalculations'

/**
 * Analyse les frais globaux (enveloppe + produit) sur l'ensemble des positions et assurances vie.
 * Fonction pure sans effet de bord.
 *
 * @param {Object} params
 * @param {Array} params.comptes - [{ id, frais_gestion_enveloppe }]
 * @param {Array} params.positions - [{ compte_id, symbole, quantite, prix_achat_moyen }]
 * @param {Map|Object} params.prixBourse - Map(symbole => prix) ou objet clé/valeur
 * @param {Array} params.avDetail - [{ contrat, positionsUC, valeurFondsEuros }]
 * @param {Object} params.prixUC - { [isin]: { dernier_prix } }
 * @returns {Object} KPIs calculés et positions enrichies
 */
export function analyserFraisGlobaux({
    comptes = [],
    positions = [],
    prixBourse = new Map(),
    avDetail = [],
    prixUC = {},
} = {}) {
    let totalFraisEnveloppeAnnuels = 0
    let totalFraisProduitsAnnuels = 0
    let capitalInvestiFrais = 0
    let auMoinsUneApproximation = false

    // Normalisation de prixBourse si passé sous forme d'objet standard
    const getPrixBourse = (symbole) => {
        if (!symbole) return null
        if (prixBourse instanceof Map) {
            return prixBourse.get(symbole)
        }
        return prixBourse[symbole]
    }

    // Map compte_id → frais enveloppe
    const fraisEnveloppeParCompte = new Map(
        comptes.map(c => [c.id, Number(c.frais_gestion_enveloppe) || 0])
    )

    // ── Positions boursières ──────────────────────────────────────────────
    const positionsEnrichies = positions.map(p => {
        const prixMarche = getPrixBourse(p.symbole)
        const valorisationApproximative = prixMarche == null || prixMarche <= 0
        const prixEffectif = valorisationApproximative
            ? Number(p.prix_achat_moyen)
            : Number(prixMarche)
        const valeurPosition = Number(p.quantite) * prixEffectif

        if (valorisationApproximative) auMoinsUneApproximation = true

        const fraisEnveloppe = fraisEnveloppeParCompte.get(p.compte_id) || 0
        const fraisProduit = 0

        totalFraisEnveloppeAnnuels += valeurPosition * (fraisEnveloppe / 100)
        totalFraisProduitsAnnuels += valeurPosition * (fraisProduit / 100)
        capitalInvestiFrais += valeurPosition

        return { ...p, valeurPosition, valorisationApproximative }
    })

    // ── Assurances vie ────────────────────────────────────────────────────
    for (const { contrat = {}, positionsUC = [], valeurFondsEuros = 0 } of avDetail) {
        const { total: valeurAV } = calculerValeurActuelleContrat(
            valeurFondsEuros, positionsUC, prixUC
        )
        const terMoyen = calculerTerMoyenPondere(positionsUC, prixUC)
        const { fraisAnnuelsEuros } = calculerFraisAV(
            contrat.frais_gestion_enveloppe, terMoyen, valeurAV
        )

        const fraisEnvelAV = valeurAV * (Number(contrat.frais_gestion_enveloppe) || 0) / 100
        const fraisTerAV = fraisAnnuelsEuros - fraisEnvelAV

        totalFraisEnveloppeAnnuels += fraisEnvelAV
        totalFraisProduitsAnnuels += Math.max(0, fraisTerAV)
        capitalInvestiFrais += valeurAV
    }

    const totalFraisAnnuels = totalFraisEnveloppeAnnuels + totalFraisProduitsAnnuels
    const tauxFraisMoyen = capitalInvestiFrais > 0 ? (totalFraisAnnuels / capitalInvestiFrais) : 0

    return {
        totalFraisEnveloppeAnnuels,
        totalFraisProduitsAnnuels,
        totalFraisAnnuels,
        tauxFraisMoyen,
        capitalInvesti: capitalInvestiFrais,
        valorisationsApproximatives: auMoinsUneApproximation,
        cryptoExclue: true,
        positionsEnrichies,
    }
}

/**
 * Calcule la projection du manque à gagner sur 30 ans avec intérêts composés.
 *
 * @param {Object} params
 * @param {number} params.capitalInvesti - Capital de départ
 * @param {number} params.tauxFraisMoyen - Taux de frais annuel (ex: 0.015 pour 1.5%)
 * @param {number} [params.rendementBrut=0.07] - Rendement brut annuel (défaut 7%)
 * @param {number} [params.horizon=30] - Nombre d'années de projection
 * @returns {Array<{ annee, capitalBrut, capitalNet, siphonne }>}
 */
export function calculerTrajectoireFrais({
    capitalInvesti = 0,
    tauxFraisMoyen = 0,
    rendementBrut = 0.07,
    horizon = 30,
} = {}) {
    const rendementNet = rendementBrut - tauxFraisMoyen
    const trajectoire = []

    let capitalBrut = capitalInvesti || 10000
    let capitalNet = capitalInvesti || 10000

    for (let annee = 1; annee <= horizon; annee++) {
        capitalBrut = capitalBrut * (1 + rendementBrut)
        capitalNet = capitalNet * (1 + rendementNet)

        trajectoire.push({
            annee,
            capitalBrut: Math.round(capitalBrut),
            capitalNet: Math.round(capitalNet),
            siphonne: Math.round(capitalBrut - capitalNet),
        })
    }

    return trajectoire
}
