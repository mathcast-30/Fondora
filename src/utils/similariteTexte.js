/**
 * Calcule la distance de Levenshtein standard par programmation dynamique.
 * Cette distance mesure le nombre minimal d'opérations (insertion, suppression, substitution)
 * nécessaires pour passer d'une chaîne à l'autre.
 * La comparaison est insensible à la casse.
 *
 * @param {string} a - Première chaîne.
 * @param {string} b - Deuxième chaîne.
 * @returns {number} Distance de Levenshtein.
 */
export function distanceLevenshtein(a, b) {
  const strA = String(a || '').toUpperCase();
  const strB = String(b || '').toUpperCase();

  const m = strA.length;
  const n = strB.length;

  // Création de la matrice de taille (m + 1) x (n + 1)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cout = strA[i - 1] === strB[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Suppression
        dp[i][j - 1] + 1,      // Insertion
        dp[i - 1][j - 1] + cout // Substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Détermine si deux mots-clés sont similaires en comparant leur distance de Levenshtein
 * par rapport à un seuil donné.
 *
 * IMPORTANT:
 * - Cette fonction est destinée à rapprocher des mots-clés courts (ex: variantes orthographiques
 *   d'une même enseigne comme "Leclerc" vs "E.Leclerc" ou dédoublonnage de règles).
 * - Elle NE doit PAS être utilisée directement pour scanner un libellé complet de transaction bancaire.
 *   Pour détecter une enseigne ou un mot-clé dans une transaction (ex: "ACHAT CARREFOUR PARIS"),
 *   la méthode standard `.includes()` doit être privilégiée afin d'éviter les faux positifs
 *   et de maintenir de bonnes performances.
 *
 * @param {string} a - Première chaîne.
 * @param {string} b - Deuxième chaîne.
 * @param {number} [seuil=2] - Le seuil de distance maximum toléré.
 * @returns {boolean} True si la distance est inférieure ou égale au seuil.
 */
export function sontSimilaires(a, b, seuil = 2) {
  return distanceLevenshtein(a, b) <= seuil;
}
