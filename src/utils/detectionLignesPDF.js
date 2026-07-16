/**
 * detectionLignesPDF.js
 * Détection heuristique de transactions bancaires à partir de lignes de texte
 * extraites d'un PDF (texte natif ou OCR).
 *
 * Chaque ligne reconnue produit un objet :
 *   { date, description, montant, type, confiance: 'haute'|'moyenne' }
 *
 * Les descriptions multi-lignes sont assemblées : toute ligne non-transactionnelle
 * suivant une transaction est concaténée à la description de cette dernière.
 */

import { genererHashTransaction } from './normalisationTransactions';

// ─── Regex de détection ──────────────────────────────────────────────────────

/** Date format français standard : JJ/MM/AAAA ou JJ.MM.AAAA ou JJ-MM-AAAA */
const RE_DATE_FR = /\b(\d{2})[./-](\d{2})[./-](\d{4})\b/;

/** Date format ISO : AAAA-MM-JJ */
const RE_DATE_ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;

/** Date textuelle courte française : "12 janv.", "3 févr.", "14 mars" */
const MOIS_FR_MAP = {
  'janv': '01', 'jan': '01', 'janvier': '01',
  'fevr': '02', 'fev': '02', 'fevrier': '02',
  'mars': '03', 'mar': '03',
  'avr': '04', 'avril': '04',
  'mai': '05',
  'juin': '06', 'jun': '06',
  'juil': '07', 'jul': '07', 'juillet': '07',
  'aout': '08', 'aou': '08',
  'sept': '09', 'sep': '09', 'septembre': '09',
  'oct': '10', 'octobre': '10',
  'nov': '11', 'novembre': '11',
  'dec': '12', 'decembre': '12'
};

/**
 * Construit le pattern des mois français pour la regex de date textuelle.
 * Tri par longueur décroissante pour que les mots les plus longs matchent en priorité.
 */
const moisPattern = Object.keys(MOIS_FR_MAP).sort((a, b) => b.length - a.length).join('|');

/**
 * Regex pour dates textuelles FR.
 * On utilise String.raw pour éviter le double-échappement.
 */
const RE_DATE_TEXTE_FR = new RegExp(
  String.raw`\b(\d{1,2})\s+(` + moisPattern + String.raw`)\.?(?:\s+(\d{4}))?\b`, 'i'
);

/**
 * Montant signé ou entre parenthèses.
 * Exemples : -12,50 / +1 234,56 / 12.50 / (42,00) / 1234.56
 */
const RE_MONTANT_SRC = String.raw`[-+]?\d[\d ]*[.,]\d{2}|\(\d[\d ]*[.,]\d{2}\)`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tente d'extraire une date d'une ligne de texte et la normalise en AAAA-MM-JJ.
 * Retourne null si aucune date reconnue.
 */
function extraireDate(ligne) {
  // 1) Format FR standard
  const matchFR = ligne.match(RE_DATE_FR);
  if (matchFR) {
    const [, jj, mm, aaaa] = matchFR;
    const jour = Number.parseInt(jj, 10);
    const mois = Number.parseInt(mm, 10);
    if (jour >= 1 && jour <= 31 && mois >= 1 && mois <= 12) {
      return { date: `${aaaa}-${mm}-${jj}`, index: matchFR.index + matchFR[0].length };
    }
  }

  // 2) Format ISO
  const matchISO = ligne.match(RE_DATE_ISO);
  if (matchISO) {
    const [, aaaa, mm, jj] = matchISO;
    return { date: `${aaaa}-${mm}-${jj}`, index: matchISO.index + matchISO[0].length };
  }

  // 3) Format textuel français court
  const matchTxt = ligne.match(RE_DATE_TEXTE_FR);
  if (matchTxt) {
    const jour = matchTxt[1].padStart(2, '0');
    // Normalisation sans accents pour matcher le dictionnaire (clés sans accents)
    const moisStr = matchTxt[2].toLowerCase()
      .replaceAll('.', '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const mois = MOIS_FR_MAP[moisStr];
    const annee = matchTxt[3] || String(new Date().getFullYear());
    if (mois) {
      return { date: `${annee}-${mois}-${jour}`, index: matchTxt.index + matchTxt[0].length };
    }
  }

  return null;
}

/**
 * Extrait tous les montants candidats d'une ligne.
 * Retourne le DERNIER montant trouvé (convention bancaire : montant à droite).
 */
function extraireMontant(ligne) {
  // Nettoyer les espaces insécables
  const lignePropre = ligne.replaceAll('\u00a0', ' ');

  const matchs = [];
  let m;
  const regex = new RegExp(RE_MONTANT_SRC, 'g');

  while ((m = regex.exec(lignePropre)) !== null) {
    let raw = m[0].trim();

    // Gestion des montants entre parenthèses = négatif
    let negatif = false;
    if (raw.startsWith('(') && raw.endsWith(')')) {
      raw = raw.slice(1, -1).trim();
      negatif = true;
    } else if (raw.startsWith('-')) {
      raw = raw.replace(/^-\s*/, '');
      negatif = true;
    }

    // Nettoyage : enlever les espaces de milliers, virgule → point
    raw = raw.replaceAll(' ', '').replaceAll(',', '.');

    const valeur = Number.parseFloat(raw);
    if (!Number.isNaN(valeur) && valeur > 0) {
      matchs.push({
        valeur: negatif ? -valeur : valeur,
        index: m.index
      });
    }
  }

  if (matchs.length === 0) return null;

  // Prendre le dernier montant de la ligne (position la plus à droite)
  const dernier = matchs.at(-1);
  return {
    montant: Math.abs(dernier.valeur),
    type: dernier.valeur < 0 ? 'depense' : 'revenu',
    index: dernier.index
  };
}

/**
 * Extrait la description entre la date et le montant.
 */
function extraireDescription(ligne, indexApresDate, indexMontant) {
  const debut = indexApresDate || 0;
  const fin = indexMontant !== undefined ? indexMontant : ligne.length;
  const desc = ligne.slice(debut, fin).trim();
  // Nettoyage : supprimer les séparateurs de colonnes et espaces multiples
  return desc.replaceAll(/\s{2,}/g, ' ').replace(/^\s*[|:]\s*/, '').replace(/\s*[|:]\s*$/, '');
}

// ─── Sous-fonctions de traitement des lignes ──────────────────────────────────

/**
 * Traite une ligne complète (date + montant détectés).
 */
async function traiterLigneComplete(ligne, dateResult, montantResult, compteId) {
  const description = extraireDescription(ligne, dateResult.index, montantResult.index);
  const confiance = description.length > 3 ? 'haute' : 'moyenne';
  const import_hash = await genererHashTransaction(
    dateResult.date, description, montantResult.montant, compteId
  );

  return {
    date: dateResult.date,
    description: description || 'Transaction non décrite',
    montant: montantResult.montant,
    type: montantResult.type,
    confiance,
    import_hash,
    source: 'import_pdf'
  };
}

/**
 * Traite une ligne avec date seule (début de transaction multi-ligne).
 */
function traiterLigneDateSeule(ligne, dateResult) {
  const descPartielle = ligne.slice(dateResult.index).trim();
  return {
    date: dateResult.date,
    description: descPartielle,
    montant: 0,
    type: 'depense',
    confiance: 'moyenne',
    import_hash: '',
    source: 'import_pdf'
  };
}

/**
 * Complète une transaction en attente avec un montant trouvé sur la ligne suivante.
 */
async function completerTransactionAvecMontant(derniereTx, ligne, montantResult, compteId) {
  derniereTx.montant = montantResult.montant;
  derniereTx.type = montantResult.type;

  const descSupp = ligne.slice(0, montantResult.index).trim();
  if (descSupp.length > 0) {
    derniereTx.description = `${derniereTx.description} ${descSupp}`.trim();
  }

  derniereTx.import_hash = await genererHashTransaction(
    derniereTx.date, derniereTx.description, derniereTx.montant, compteId
  );

  if (derniereTx.description.length > 3 && derniereTx.montant > 0) {
    derniereTx.confiance = 'haute';
  }
}

/**
 * Concatène une ligne orpheline à la description de la dernière transaction.
 */
async function concatenerLigneOrpheline(derniereTx, ligne, compteId) {
  const texte = ligne.trim();
  if (texte.length > 2 && texte.length < 200) {
    derniereTx.description = `${derniereTx.description} ${texte}`.trim();
    if (derniereTx.montant > 0) {
      derniereTx.import_hash = await genererHashTransaction(
        derniereTx.date, derniereTx.description, derniereTx.montant, compteId
      );
    }
  }
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Analyse un tableau de lignes de texte (issues d'un PDF) et détecte les transactions.
 * Les lignes « orphelines » (sans date ni montant) sont concaténées à la dernière
 * transaction détectée en tant que suite de description.
 *
 * @param {string[]} lignes - Lignes de texte extraites du PDF.
 * @param {string} compteId - ID du compte bancaire de destination.
 * @returns {Promise<Array<{date: string, description: string, montant: number, type: string, confiance: string, import_hash: string, source: string}>>}
 */
export async function detecterTransactionsPDF(lignes, compteId) {
  const transactions = [];
  let derniereTx = null;

  for (const ligne of lignes) {
    const dateResult = extraireDate(ligne);
    const montantResult = extraireMontant(ligne);

    if (dateResult && montantResult) {
      const tx = await traiterLigneComplete(ligne, dateResult, montantResult, compteId);
      transactions.push(tx);
      derniereTx = tx;
    } else if (dateResult && !montantResult) {
      const tx = traiterLigneDateSeule(ligne, dateResult);
      transactions.push(tx);
      derniereTx = tx;
    } else if (!dateResult && montantResult && derniereTx?.montant === 0) {
      await completerTransactionAvecMontant(derniereTx, ligne, montantResult, compteId);
    } else if (!dateResult && !montantResult && derniereTx) {
      await concatenerLigneOrpheline(derniereTx, ligne, compteId);
    }
  }

  // Filtrer les transactions invalides (sans montant) et retourner
  return transactions.filter(tx => tx.montant > 0 && tx.date && tx.description);
}
