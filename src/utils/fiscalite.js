export const FISCALITE_2026 = {
  PFU_IR: 0.128,           // 12.8%
  PS_FINANCIER: 0.186,     // 18.6% (placements financiers)
  PS_AV_IMMO: 0.172,       // 17.2% (AV et immobilier — dérogatoire 2026)
  PFU_GLOBAL: 0.314,       // 31.4% (12.8 + 18.6)
  PEA_APRES_5ANS_PS: 0.186,// Seuls les PS après 5 ans
  AV_APRES_8ANS_IR: 0.075, // 7.5% IR réduit après 8 ans
  AV_APRES_8ANS_GLOBAL: 0.247, // 7.5 + 17.2
  AV_ABATTEMENT_CELIBATAIRE: 4600,
  AV_ABATTEMENT_MARIE: 9200,
  AV_SEUIL_PRIME_150K: 150000, // Au-delà → 12.8% au lieu de 7.5%
};

/**
 * Calcule l'impôt latent sur un PEA
 * @param {number} valeurActuelle - Valeur totale du portefeuille PEA
 * @param {number} totalVersements - Somme de tous les versements
 * @param {string} dateOuverture - ISO string date d'ouverture
 * @returns {{ plusValueBrute, impotLatent, netInPocket, anneesDetention, apres5ans }}
 */
export function calculerImpotPEA(valeurActuelle, totalVersements, dateOuverture) {
  const aujourd = new Date();
  const ouverture = new Date(dateOuverture);
  const anneesDetention = (aujourd - ouverture) / (1000 * 60 * 60 * 24 * 365.25);
  const apres5ans = anneesDetention >= 5;

  const plusValueBrute = Math.max(0, valeurActuelle - totalVersements);

  // Avant 5 ans : PFU 31.4%
  // Après 5 ans : uniquement PS 18.6%
  const tauxEffectif = apres5ans
    ? FISCALITE_2026.PEA_APRES_5ANS_PS
    : FISCALITE_2026.PFU_GLOBAL;

  const impotLatent = plusValueBrute * tauxEffectif;
  const netInPocket = valeurActuelle - impotLatent;

  return { plusValueBrute, impotLatent, netInPocket, anneesDetention, apres5ans, tauxEffectif };
}

/**
 * Calcule l'impôt latent sur un CTO
 * @param {number} valeurActuelle
 * @param {number} totalVersements
 * @returns {{ plusValueBrute, impotLatent, netInPocket }}
 */
export function calculerImpotCTO(valeurActuelle, totalVersements) {
  const plusValueBrute = Math.max(0, valeurActuelle - totalVersements);
  const impotLatent = plusValueBrute * FISCALITE_2026.PFU_GLOBAL; // 31.4%
  const netInPocket = valeurActuelle - impotLatent;

  return { plusValueBrute, impotLatent, netInPocket, tauxEffectif: FISCALITE_2026.PFU_GLOBAL };
}

/**
 * Même règle que CTO : PFU 30% (12.8 IR + 17.2 PS — règle française crypto 2026)
 * Note : les PS crypto sont à 17.2% (pas 18.6%) car classifiés différemment
 */
export function calculerImpotCrypto(valeurActuelle, totalVersements) {
  // Crypto : IR 12.8% + PS 17.2% = 30% (maintien dérogatoire 2026)
  const TAUX_CRYPTO = 0.128 + 0.172; // = 0.30
  const plusValueBrute = Math.max(0, valeurActuelle - totalVersements);
  const impotLatent = plusValueBrute * TAUX_CRYPTO;
  const netInPocket = valeurActuelle - impotLatent;

  return { plusValueBrute, impotLatent, netInPocket, tauxEffectif: TAUX_CRYPTO };
}

/**
 * Calcule l'impôt latent sur un contrat AV
 * @param {number} valeurActuelle - Valeur de rachat totale
 * @param {number} totalPrimesVersees - Cumul des versements
 * @param {string} dateOuverture
 * @param {'celibataire'|'marie'} situationFamiliale
 * @param {number} totalPrimesTousContrats - Pour vérifier seuil 150k
 */
export function calculerImpotAV(
  valeurActuelle,
  totalPrimesVersees,
  dateOuverture,
  situationFamiliale = 'celibataire',
  totalPrimesTousContrats = 0
) {
  const aujourd = new Date();
  const ouverture = new Date(dateOuverture);
  const anneesDetention = (aujourd - ouverture) / (1000 * 60 * 60 * 24 * 365.25);
  const apres8ans = anneesDetention >= 8;

  // Calcul du gain selon la formule légale CGI
  // Gain = R - (R × ΣPrimes / Valeur de rachat)
  // Ici on simule un rachat total donc Gain = Valeur - Primes
  const gainBrut = Math.max(0, valeurActuelle - totalPrimesVersees);

  if (gainBrut === 0) {
    return { gainBrut: 0, impotLatent: 0, netInPocket: valeurActuelle, apres8ans, anneesDetention };
  }

  if (!apres8ans) {
    // Avant 8 ans : PFU 30% (12.8 IR + 17.2 PS dérogatoire AV)
    const impotLatent = gainBrut * (FISCALITE_2026.PFU_IR + FISCALITE_2026.PS_AV_IMMO);
    return {
      gainBrut,
      impotLatent,
      netInPocket: valeurActuelle - impotLatent,
      apres8ans,
      anneesDetention,
      tauxEffectif: FISCALITE_2026.PFU_IR + FISCALITE_2026.PS_AV_IMMO,
    };
  }

  // Après 8 ans : abattement + taux réduit
  const abattement = situationFamiliale === 'marie'
    ? FISCALITE_2026.AV_ABATTEMENT_MARIE
    : FISCALITE_2026.AV_ABATTEMENT_CELIBATAIRE;

  const gainApresAbattement = Math.max(0, gainBrut - abattement);

  // Vérifier le seuil 150k sur l'ensemble des primes tous contrats
  const primesAuDessusSeuil = Math.max(0, totalPrimesTousContrats - FISCALITE_2026.AV_SEUIL_PRIME_150K);
  const ratioExces = totalPrimesTousContrats > 0
    ? Math.min(1, primesAuDessusSeuil / totalPrimesTousContrats)
    : 0;

  // Part du gain soumise au taux réduit 7.5% vs taux normal 12.8%
  const gainTauxReduit = gainApresAbattement * (1 - ratioExces);
  const gainTauxNormal = gainApresAbattement * ratioExces;

  const impotIR = gainTauxReduit * FISCALITE_2026.AV_APRES_8ANS_IR
    + gainTauxNormal * FISCALITE_2026.PFU_IR;
  const impotPS = gainBrut * FISCALITE_2026.PS_AV_IMMO; // PS sur gain brut complet (pas d'abattement pour les PS)

  const impotLatent = impotIR + impotPS;
  const netInPocket = valeurActuelle - impotLatent;
  const tauxEffectif = gainBrut > 0 ? impotLatent / gainBrut : 0;

  return {
    gainBrut,
    impotIR,
    impotPS,
    impotLatent,
    netInPocket,
    apres8ans,
    anneesDetention,
    abattementApplique: abattement,
    tauxEffectif,
  };
}

/**
 * Calcule le score d'efficacité fiscale (0 à 100)
 * 100 = aucun impôt latent / tout dans PEA après 5 ans
 * 0   = tout dans CTO avec 31.4% sur tout
 *
 * Formule : (1 - ImpôtLatentTotal / PlusValueBruteTotal) × 100
 */
export function calculerScoreEfficaciteFiscale(enveloppes) {
  // enveloppes = tableau de { plusValueBrute, impotLatent }
  const totalPV = enveloppes.reduce((acc, e) => acc + (e.plusValueBrute || 0), 0);
  const totalImpot = enveloppes.reduce((acc, e) => acc + (e.impotLatent || 0), 0);

  if (totalPV === 0) return 100; // Pas de plus-value = fiscalement parfait

  const tauxMoyenReel = totalImpot / totalPV;
  // Taux max théorique = 31.4% (tout en CTO)
  const score = Math.round((1 - tauxMoyenReel / 0.314) * 100);
  return Math.max(0, Math.min(100, score));
}

/**
 * Génère les recommandations intelligentes
 * @returns {Array<{ type: 'warning'|'info'|'success', titre, message, priorite }>}
 */
export function genererRecommandations(enveloppesAnalysees, situationFamiliale) {
  const recommandations = [];

  enveloppesAnalysees.forEach((env) => {
    // CTO avec plus-value significative → migrer vers PEA
    if (env.typeEnveloppe === 'CTO' && env.plusValueBrute > 1000) {
      recommandations.push({
        type: 'warning',
        priorite: 1,
        titre: `${env.nom} — Enveloppe fiscalement coûteuse`,
        message: `Votre CTO "${env.nom}" supporte 31,4% d'imposition. Envisagez de transférer progressivement vos prochains investissements vers un PEA pour réduire la fiscalité à 18,6% après 5 ans.`,
      });
    }

    // PEA proche des 5 ans
    if (env.typeEnveloppe === 'PEA' && !env.apres5ans && env.anneesDetention >= 4) {
      const moisRestants = Math.ceil((5 - env.anneesDetention) * 12);
      recommandations.push({
        type: 'info',
        priorite: 2,
        titre: `${env.nom} — Encore ${moisRestants} mois avant l'avantage fiscal`,
        message: `Votre PEA "${env.nom}" sera fiscalement avantageux dans ${moisRestants} mois. Évitez tout retrait avant cette date pour ne pas clôturer le plan.`,
      });
    }

    // AV proche des 8 ans
    if (env.typeEnveloppe === 'AV' && !env.apres8ans && env.anneesDetention >= 7) {
      const moisRestants = Math.ceil((8 - env.anneesDetention) * 12);
      recommandations.push({
        type: 'info',
        priorite: 2,
        titre: `${env.nom} — Patience ! ${moisRestants} mois avant l'abattement`,
        message: `Votre contrat "${env.nom}" entre dans la fiscalité avantageuse dans ${moisRestants} mois (abattement de ${situationFamiliale === 'marie' ? '9 200' : '4 600'}€/an sur les gains). Évitez les rachats importants avant cette date.`,
      });
    }

    // AV après 8 ans avec abattement non utilisé
    if (env.typeEnveloppe === 'AV' && env.apres8ans && env.gainBrut > 0) {
      const abattement = situationFamiliale === 'marie' ? 9200 : 4600;
      recommandations.push({
        type: 'success',
        priorite: 3,
        titre: `${env.nom} — Abattement fiscal disponible`,
        message: `Votre contrat est éligible à l'abattement de ${abattement.toLocaleString('fr-FR')}€/an. Vous pouvez effectuer des rachats partiels à hauteur de cet abattement sans payer d'IR sur les gains.`,
      });
    }

    // Crypto avec plus-value importante
    if (env.typeEnveloppe === 'Crypto' && env.plusValueBrute > 5000) {
      recommandations.push({
        type: 'warning',
        priorite: 1,
        titre: `Crypto — Plus-value latente importante`,
        message: `Votre portefeuille crypto affiche ${env.plusValueBrute.toLocaleString('fr-FR')}€ de plus-value imposable à 30%. Pensez à échelonner vos cessions sur plusieurs années fiscales pour lisser l'imposition.`,
      });
    }
  });

  // Trier par priorité
  return recommandations.sort((a, b) => a.priorite - b.priorite);
}
