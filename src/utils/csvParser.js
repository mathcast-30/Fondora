import Papa from 'papaparse';

// =============================================================================
// BRIQUE 1 – DÉTECTION D'ENCODAGE ET DE DÉLIMITEUR
// =============================================================================

/**
 * Détecte le délimiteur le plus probable d'un texte CSV.
 * Stratégie : on compte les occurrences de ',', ';' et '\t' sur les 5 premières
 * lignes non vides, hors guillemets, et on retient celui qui est le plus fréquent
 * ET le plus régulier (même nombre par ligne).
 *
 * @param {string} fileText - Contenu brut du fichier (déjà décodé en string).
 * @returns {{ encodage: string, delimiteur: string }}
 */
/**
 * Compte les occurrences d'un caractère dans une ligne
 * en ignorant les contenus entre guillemets doubles.
 * Déplacé au scope module pour éviter la redéfinition à chaque appel.
 */
function compterHorsGuillemets(ligne, car) {
  let count = 0;
  let dansGuillemets = false;
  for (const ch of ligne) {
    if (ch === '"') {
      dansGuillemets = !dansGuillemets;
    } else if (!dansGuillemets && ch === car) {
      count++;
    }
  }
  return count;
}

export function detecterEncodageEtDelimiteur(fileText) {
  // --- Encodage ---
  // En environnement Web, le texte est toujours déjà une string JS (UTF-16 interne).
  // On détecte l'encodage SOURCE en cherchant des séquences d'octets caractéristiques
  // de l'ISO-8859-1 mal interprété : les caractères accentués français (é, à, ü…)
  // apparaissent comme des suites de deux caractères lorsque le fichier est
  // ISO-8859-1 lu comme UTF-8 (ex: "Ã©" pour "é").
  let encodage = 'UTF-8';
  if (/\u00C3[\u00A0-\u00BF]|\u00C3[\u0080-\u009F]/.test(fileText)) {
    // Séquences typiques de double-encodage ISO-8859-1 → UTF-8 mal parsé
    encodage = 'ISO-8859-1';
  }

  // --- Délimiteur ---
  // On extrait les 5 premières lignes non vides
  const lignesTest = fileText
    .split(/\r?\n/)
    .filter(l => l.trim().length > 0)
    .slice(0, 5);

  const candidats = [',', ';', '\t'];

  let meilleurDelimiteur = ';'; // défaut français
  let meilleurScore = -1;

  for (const car of candidats) {
    const counts = lignesTest.map(l => compterHorsGuillemets(l, car));
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) continue;

    // Régularité : on vérifie que le mode (valeur la plus fréquente) est dominant
    const mode = counts
      .slice() // Copie pour ne pas muter
      .sort((a, b) => a - b)[Math.floor(counts.length / 2)]; // médiane
    const regularite = counts.filter(c => c === mode).length;

    // Score composite : total occurrences × régularité
    const score = total * regularite;
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleurDelimiteur = car;
    }
  }

  return { encodage, delimiteur: meilleurDelimiteur };
}

// =============================================================================
// BRIQUE 2 – DÉTECTION DE LA PREMIÈRE LIGNE DE DONNÉES
// =============================================================================

/**
 * Scanne un tableau de lignes (format tableau de tableaux, header:false) et
 * retourne l'index de la première ligne qui contient SIMULTANÉMENT :
 *  - Une date reconnaissable (JJ/MM/AAAA, JJ-MM-AAAA, AAAA-MM-JJ, AAAA/MM/JJ)
 *  - Un montant numérique (entier ou décimal avec ',' ou '.')
 *  - Un texte non vide d'au moins 2 caractères (description / libellé)
 *
 * Toute ligne précédente (ex: "Solde au 15/05/2026 : 1 234,56 €") est ignorée
 * même si elle contient une date, car elle ne satisfait pas les 3 critères sur
 * des colonnes distinctes.
 *
 * @param {Array<Array<string>>} lignes - Tableau de lignes (header:false de PapaParse).
 * @param {string} delimiteur - Délimiteur détecté (non utilisé directement ici
 *   car PapaParse a déjà splitté, mais gardé pour cohérence d'API).
 * @returns {number} Index de la première ligne de données, ou -1 si introuvable.
 */
export function trouverLignePremiereDonnees(lignes, _delimiteur) {
  // Regex de dates : JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA, AAAA-MM-JJ, AAAA/MM/JJ
  // Les \/  sont retirés car / n'a pas besoin d'être échappé dans une classe de caractères
  const RE_DATE = /^(\d{2}[./-]\d{2}[./-]\d{4}|\d{4}[./-]\d{2}[./-]\d{2})$/;

  // Regex de montant : chiffres avec séparateur optionnel (virgule ou point)
  // Accepte les montants négatifs, les espaces insécables comme séparateur de milliers
  const RE_MONTANT = /^-?[\d\s\u00a0]+[,.]\d{1,4}$|^-?\d+$/;

  for (let i = 0; i < lignes.length; i++) {
    const cellules = lignes[i];
    if (!Array.isArray(cellules) || cellules.length < 2) continue;

    const vals = cellules.map(c => String(c ?? '').trim());

    // Critère 1 : au moins une cellule est une date valide
    const aUneDate = vals.some(v => RE_DATE.test(v));
    if (!aUneDate) continue;

    // Critère 2 : au moins une cellule est un montant numérique
    // On nettoie d'abord les espaces insécables et les symboles monétaires
    const aUnMontant = vals.some(v => {
      const propre = v.replace(/[€$£\s\u00a0]/g, '').replace(/\s/g, '');
      return RE_MONTANT.test(propre) && propre.length > 0 && propre !== '-';
    });
    if (!aUnMontant) continue;

    // Critère 3 : au moins une cellule est un texte ≥ 2 chars (hors date et montant)
    const aUnTexte = vals.some(v => {
      if (v.length < 2) return false;
      if (RE_DATE.test(v)) return false; // exclure la date
      const propre = v.replace(/[€$£\s\u00a0]/g, '');
      if (RE_MONTANT.test(propre)) return false; // exclure le montant
      return true;
    });
    if (!aUnTexte) continue;

    return i;
  }

  return -1;
}

// =============================================================================
// BRIQUE 3 – PARSING CSV BRUT
// =============================================================================

/**
 * Parse un texte CSV brut avec PapaParse (header:false), applique la détection
 * d'encodage/délimiteur et la recherche de la première ligne de données.
 *
 * @param {string} fileText - Contenu brut du fichier CSV.
 * @returns {{
 *   headers: string[],
 *   lignes: Object[],
 *   lignesBrutes: Array<Array<string>>,
 *   delimiteur: string,
 *   encodage: string,
 *   indexDebutDonnees: number
 * }}
 */
export function parserCSVBrut(fileText) {
  const { encodage, delimiteur } = detecterEncodageEtDelimiteur(fileText);

  // Première passe : header:false pour avoir accès à toutes les lignes brutes
  const resultatBrut = Papa.parse(fileText, {
    header: false,
    delimiter: delimiteur,
    skipEmptyLines: 'greedy',
  });

  const toutesLignes = resultatBrut.data;

  // Chercher la première ligne de données réelles
  const indexDonnees = trouverLignePremiereDonnees(toutesLignes, delimiteur);

  // La ligne juste avant les données est l'en-tête (si elle existe)
  // On utilise trouverLigneEntete (existant) comme fallback si trouverLignePremiereDonnees
  // retourne 0 ou -1 (pas de ligne parasite)
  let indexEntete = indexDonnees > 0 ? indexDonnees - 1 : 0;
  if (indexDonnees === -1) indexEntete = 0;

  const headers = (toutesLignes[indexEntete] || []).map(h => String(h).trim());

  // Deuxième passe : header:true sur le sous-ensemble
  const lignesAvecEntete = toutesLignes.slice(indexEntete);
  const csvReparse = Papa.unparse(lignesAvecEntete, { delimiter: delimiteur });
  const resultatFinal = Papa.parse(csvReparse, {
    header: true,
    delimiter: delimiteur,
    skipEmptyLines: 'greedy',
  });

  return {
    headers,
    lignes: resultatFinal.data,
    lignesBrutes: toutesLignes,
    delimiteur,
    encodage,
    indexDebutDonnees: indexDonnees,
  };
}

// =============================================================================
// SIGNATURESEXISTANTES + UTILS EXISTANTS (PRÉSERVÉS)
// =============================================================================

export const BANK_SIGNATURES = {
  boursorama: {
    nom: 'Boursorama',
    headers: ['dateOp', 'dateVal', 'libelle', 'montant'],
    mapping: { date: 'dateOp', libelle: 'libelle', montant: 'montant' },
    separateur: ';'
  },
  bnp: {
    nom: 'BNP Paribas',
    headers: ['Date', 'Libellé', 'Montant'],
    mapping: { date: 'Date', libelle: 'Libellé', montant: 'Montant' },
    separateur: ';'
  },
  credit_agricole: {
    nom: 'Crédit Agricole',
    headers: ["Date de l'opération", "Libellé de l'opération", 'Débit', 'Crédit'],
    mapping: { date: "Date de l'opération", libelle: "Libellé de l'opération", debit: 'Débit', credit: 'Crédit' },
    separateur: ';'
  },
  societe_generale: {
    nom: 'Société Générale',
    headers: ['Date', 'Libellé', 'Débit', 'Crédit', 'Détail'],
    mapping: { date: 'Date', libelle: 'Libellé', debit: 'Débit', credit: 'Crédit' },
    separateur: ';'
  },
  credit_mutuel: {
    nom: 'Crédit Mutuel',
    headers: ['Date', 'Opération', 'Débit', 'Crédit', 'Solde'],
    mapping: { date: 'Date', libelle: 'Opération', debit: 'Débit', credit: 'Crédit' },
    separateur: ';'
  },
  fortuneo: {
    nom: 'Fortuneo',
    headers: ['Date opération', 'Libellé', 'Montant opération', 'Devise'],
    mapping: { date: 'Date opération', libelle: 'Libellé', montant: 'Montant opération' },
    separateur: ';'
  },
  revolut: {
    nom: 'Revolut',
    headers: ['Type', 'Product', 'Started Date', 'Description', 'Amount', 'Currency'],
    mapping: { date: 'Started Date', libelle: 'Description', montant: 'Amount' },
    separateur: ','
  }
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 */
function levenshtein(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // suppression
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Détecte la banque en fonction des headers CSV.
 * Retourne la clé de BANK_SIGNATURES correspondante ou null.
 */
export function detecterBanque(headers) {
  if (!headers || !Array.isArray(headers)) return null;
  const normalizedHeaders = headers.map(h => String(h).trim().toLowerCase());

  for (const [key, config] of Object.entries(BANK_SIGNATURES)) {
    const signatureHeaders = config.headers;
    const matchCount = signatureHeaders.filter(sigH => {
      const normalizedSigH = sigH.trim().toLowerCase();
      return normalizedHeaders.includes(normalizedSigH);
    }).length;

    // Si au moins 80% des headers de la signature sont présents
    if (matchCount / signatureHeaders.length >= 0.8) {
      return key;
    }
  }
  return null;
}

/**
 * Trouve la première ligne d'en-tête valide dans un tableau de lignes brutes.
 */
export function trouverLigneEntete(rows) {
  if (!rows || !Array.isArray(rows)) return -1;
  const TARGET_WORDS = ['date', 'libel', 'montant', 'debit', 'credit', 'oper', 'dateop', 'amount'];
  const clean = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    // Contient au moins 3 colonnes non vides
    const nonVidesCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;
    if (nonVidesCount < 3) continue;

    // Ne commence pas par un chiffre
    const firstCell = row.length > 0 ? String(row[0]).trim() : '';
    if (/^\d/.test(firstCell)) continue;

    // Contient au moins un mot cible
    const hasTarget = row.some(cell => {
      const cleaned = clean(cell);
      return TARGET_WORDS.some(word => cleaned.includes(word));
    });

    if (hasTarget) {
      return i;
    }
  }
  return -1;
}

/**
 * Normalise un montant à partir d'une ou deux colonnes et retourne { montant, type }.
 */
export function normaliserMontant(valeurDebit, valeurCredit, separateurDecimal) {
  const cleanVal = (val) => {
    if (val === null || val === undefined) return '';
    let s = String(val).replace(/\s/g, '').replace(/\u00a0/g, '');
    s = s.replace(separateurDecimal || ',', '.');
    s = s.replace(/[^0-9.\-+]/g, '');
    return s;
  };

  const hasCredit = valeurCredit !== undefined && valeurCredit !== null && String(valeurCredit).trim() !== '';

  let montant = 0;
  if (hasCredit) {
    const cleanD = cleanVal(valeurDebit);
    const cleanC = cleanVal(valeurCredit);
    const debit = cleanD ? Math.abs(parseFloat(cleanD) || 0) : 0;
    const credit = cleanC ? Math.abs(parseFloat(cleanC) || 0) : 0;
    montant = -debit + credit;
  } else {
    const cleanD = cleanVal(valeurDebit);
    montant = parseFloat(cleanD) || 0;
  }

  // Arrondir à 2 décimales
  montant = Math.round(montant * 100) / 100;
  const type = montant < 0 ? 'depense' : 'revenu';
  montant = Math.abs(montant);

  return { montant, type };
}

/**
 * Génère une chaîne déterministe unique pour éviter les doublons.
 */
export function genererImportHash(date, libelle, montant, compteId) {
  const cleanLibelle = String(libelle || '').trim().toLowerCase();
  return `${date}|${cleanLibelle}|${montant}|${compteId}`;
}

/**
 * Applique les smart rules sur un libellé pour deviner la catégorie.
 */
export function appliquerSmartRules(libelle, smartRules) {
  if (!libelle || !smartRules || !Array.isArray(smartRules)) return null;

  // Trier par priorite ASC
  const sortedRules = [...smartRules].sort((a, b) => (a.priorite || 0) - (b.priorite || 0));
  const cleanLibelle = String(libelle).toLowerCase();

  // Passe 1 : Correspondance exacte
  for (const rule of sortedRules) {
    if (!rule.mot_cle) continue;
    const cleanMot = rule.mot_cle.toLowerCase();
    if (cleanLibelle.includes(cleanMot)) {
      return rule.categorie_id;
    }
  }

  // Passe 2 : Levenshtein
  const words = cleanLibelle.split(/[^a-z0-9]/).filter(w => w.length >= 3);

  for (const rule of sortedRules) {
    if (!rule.mot_cle) continue;
    const cleanMot = rule.mot_cle.toLowerCase();

    if (cleanMot.length >= 5) {
      for (const word of words) {
        if (levenshtein(word, cleanMot) <= 3) {
          return rule.categorie_id;
        }
      }
    }
  }

  return null;
}
