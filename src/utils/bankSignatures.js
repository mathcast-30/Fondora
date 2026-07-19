// Dictionnaire des signatures bancaires pour le parsing et l'unification des imports CSV
// Chaque banque a sa propre signature avec ses colonnes correspondantes et son format de date.

export const SIGNATURES_BANCAIRES = {
  boursorama: {
    nom: 'Boursorama',
    colonnes: {
      date: 'dateOp',
      libelle: 'libelle',
      montant: 'montant',
      debit: null,
      credit: null
    },
    format_date: 'AAAA-MM-JJ' // Format standard ISO
  },
  credit_agricole: {
    nom: 'Crédit Agricole',
    colonnes: {
      date: "Date de l'opération",
      libelle: "Libellé de l'opération",
      montant: null,
      debit: 'Débit',
      credit: 'Crédit'
    },
    format_date: 'JJ/MM/AAAA'
  },
  bnp: {
    nom: 'BNP Paribas',
    colonnes: {
      date: 'Date',
      libelle: 'Libellé',
      montant: 'Montant',
      debit: null,
      credit: null
    },
    format_date: 'JJ/MM/AAAA'
  },
  societe_generale: {
    nom: 'Société Générale',
    colonnes: {
      date: 'Date',
      libelle: 'Libellé',
      montant: null,
      debit: 'Débit',
      credit: 'Crédit'
    },
    format_date: 'JJ/MM/AAAA'
  },
  credit_mutuel: {
    nom: 'Crédit Mutuel',
    colonnes: {
      date: 'Date',
      libelle: 'Opération',
      montant: null,
      debit: 'Débit',
      credit: 'Crédit'
    },
    format_date: 'JJ/MM/AAAA'
  },
  revolut: {
    nom: 'Revolut',
    colonnes: {
      date: 'Started Date',
      libelle: 'Description',
      montant: 'Amount',
      debit: null,
      credit: null
    },
    format_date: 'AAAA-MM-JJ HH:MM:SS'
  },
  fortuneo: {
    nom: 'Fortuneo',
    colonnes: {
      date: 'Date opération',
      libelle: 'Libellé',
      montant: 'Montant opération',
      debit: null,
      credit: null
    },
    format_date: 'JJ/MM/AAAA'
  }
};

/**
 * Nettoie une chaîne de caractères en retirant les accents et en la mettant en minuscules.
 * Utile pour comparer les headers de manière robuste.
 */
function normaliserTexte(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compare les headers du CSV aux signatures connues pour détecter la banque.
 * Retourne la signature correspondante ou null si aucun match n'est trouvé.
 * La comparaison est insensible à la casse et aux accents.
 * 
 * @param {string[]} headers - Les en-têtes du CSV détectés.
 * @returns {Object|null} La signature de la banque ou null.
 */
export function detecterBanque(headers) {
  if (!headers || !Array.isArray(headers) || headers.length === 0) {
    return null;
  }

  const headersNormalises = headers.map(h => normaliserTexte(h));

  for (const [cle, signature] of Object.entries(SIGNATURES_BANCAIRES)) {
    // Collecte de toutes les colonnes requises définies pour cette signature
    const colonnesAttendues = Object.values(signature.colonnes)
      .filter(val => val !== null)
      .map(col => normaliserTexte(col));

    if (colonnesAttendues.length === 0) continue;

    // On vérifie si toutes les colonnes requises de la signature sont présentes dans les en-têtes normalisés
    const toutesPresentes = colonnesAttendues.every(colAttendue =>
      headersNormalises.includes(colAttendue)
    );

    if (toutesPresentes) {
      return { key: cle, ...signature };
    }
  }

  return null;
}
