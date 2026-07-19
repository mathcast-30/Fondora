/**
 * Nettoie une chaîne de montant pour la convertir en nombre flottant utilisable en JS.
 * Gère les espaces de milliers (y compris insécables), change les virgules en points,
 * et supprime les symboles monétaires.
 */
function nettoyerMontantStr(valStr) {
  if (valStr === null || valStr === undefined) return '';
  return String(valStr)
    .replace(/[\s\u00a0€$£]/g, '') // Supprime espaces ordinaires, insécables et monnaies
    .replace(',', '.'); // Remplace séparateur décimal français par un point
}

/**
 * Normalise et unifie le montant à partir de la ligne CSV et de la signature bancaire associée.
 * Gère le cas d'une colonne unique signée (+/-) OU de colonnes Débit/Crédit séparées.
 * 
 * @param {Object} ligne - Ligne parsée du CSV (objet clé/valeur).
 * @param {Object} signature - Signature de la banque contenant la définition des colonnes.
 * @returns {{ montant: number, type: 'depense'|'recette' }} Montant absolu et type de flux.
 */
export function unifierMontant(ligne, signature) {
  const { colonnes } = signature;

  if (colonnes.debit && colonnes.credit) {
    const debitStr = nettoyerMontantStr(ligne[colonnes.debit]);
    const creditStr = nettoyerMontantStr(ligne[colonnes.credit]);

    const debit = debitStr ? Math.abs(parseFloat(debitStr)) : 0;
    const credit = creditStr ? Math.abs(parseFloat(creditStr)) : 0;

    // Déterminer le montant final
    if (credit > 0) {
      return { montant: Math.round(credit * 100) / 100, type: 'revenu' };
    } else {
      return { montant: Math.round(debit * 100) / 100, type: 'depense' };
    }
  } else if (colonnes.montant) {
    const montantStr = nettoyerMontantStr(ligne[colonnes.montant]);
    const valeur = parseFloat(montantStr) || 0;

    const absolu = Math.round(Math.abs(valeur) * 100) / 100;
    const type = valeur >= 0 ? 'revenu' : 'depense';

    return { montant: absolu, type };
  }

  return { montant: 0, type: 'depense' };
}

/**
 * Génère un hash SHA-256 unique et déterministe pour une transaction
 * à l'aide de l'API Web Crypto (crypto.subtle.digest).
 * 
 * @param {string} date - Date normalisée (AAAA-MM-JJ).
 * @param {string} libelle - Libellé nettoyé et en minuscules.
 * @param {number} montant - Montant normalisé.
 * @param {string} compteId - Identifiant unique du compte bancaire.
 * @returns {Promise<string>} Le hash SHA-256 en chaîne hexadécimale.
 */
export async function genererHashTransaction(date, libelle, montant, compteId) {
  const cleanLibelle = String(libelle || '').trim().toLowerCase();
  const rawString = `${date}|${cleanLibelle}|${montant}|${compteId}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(rawString);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Normalise le format d'une date en AAAA-MM-JJ en fonction du format attendu par la banque.
 * Supporte : JJ/MM/AAAA, AAAA-MM-JJ, et les dates avec heure (Revolut).
 */
function normaliserDate(dateStr, formatAttendu) {
  if (!dateStr) return '';
  let cleanDate = String(dateStr).trim();

  // Si format avec heure comme Revolut (ex: "2026-05-15 14:30:22") ou ISO, on prend la partie date
  if (cleanDate.includes(' ')) {
    cleanDate = cleanDate.split(' ')[0];
  }

  // Si la date est déjà au format ISO AAAA-MM-JJ, on la retourne
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  // Analyse des formats courants français JJ/MM/AAAA ou JJ-MM-AAAA
  const matchFR = cleanDate.match(/^(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (matchFR) {
    return `${matchFR[3]}-${matchFR[2]}-${matchFR[1]}`;
  }

  // Fallback si format court à deux chiffres pour l'année
  const matchFRCourt = cleanDate.match(/^(\d{2})[./-](\d{2})[./-](\d{2})/);
  if (matchFRCourt) {
    return `20${matchFRCourt[3]}-${matchFRCourt[2]}-${matchFRCourt[1]}`;
  }

  return cleanDate;
}

/**
 * Normalise une ligne de données bancaires brutes en un objet transaction uniforme.
 * 
 * @param {Object} ligne - Ligne brute parsée du CSV.
 * @param {Object} signature - Signature de la banque émettrice.
 * @param {string} compteId - ID du compte de destination.
 * @returns {Promise<Object>} La transaction normalisée prête pour l'insertion.
 */
export async function normaliserLigne(ligne, signature, compteId) {
  const { colonnes, format_date } = signature;
  
  const rawDate = ligne[colonnes.date];
  const date = normaliserDate(rawDate, format_date);
  const description = String(ligne[colonnes.libelle] || '').trim();
  
  const { montant, type } = unifierMontant(ligne, signature);
  const import_hash = await genererHashTransaction(date, description, montant, compteId);

  return {
    date,
    description,
    montant,
    type,
    import_hash,
    source: 'import'
  };
}
