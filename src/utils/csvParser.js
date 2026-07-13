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
