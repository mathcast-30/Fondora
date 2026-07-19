/**
 * pdfOcrExtractor.js
 * Fallback OCR pour les pages PDF scannées (images sans texte natif).
 *
 * Utilise Tesseract.js chargé dynamiquement (lazy-load).
 * Rasterise la page PDF sur un canvas hors-écran, puis exécute l'OCR en français.
 * 
 * Fonctionne 100 % côté navigateur — zéro coût serveur.
 */

/**
 * Rasterise une page PDF en image sur un canvas hors-écran.
 *
 * @param {Object} pdfPage - L'objet page retourné par pdfDoc.getPage(n).
 * @param {number} [scale=2] - Échelle de rendu (2 = haute résolution pour l'OCR).
 * @returns {Promise<HTMLCanvasElement>} Le canvas contenant le rendu de la page.
 */
export async function rendreImagePage(pdfPage, scale = 2) {
  const viewport = pdfPage.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;

  return canvas;
}

/**
 * Exécute l'OCR sur un canvas contenant une page de relevé bancaire.
 *
 * @param {HTMLCanvasElement} canvas - Le canvas rendu de la page.
 * @param {function} [onProgression] - Callback optionnel (progressionFloat: 0→1).
 * @returns {Promise<string[]>} Tableau de lignes de texte reconnues.
 */
export async function ocrImagePage(canvas, onProgression) {
  // Import dynamique de Tesseract.js (lazy-load, jamais chargé si texte natif OK)
  const Tesseract = await import('tesseract.js');

  const worker = await Tesseract.createWorker('fra', undefined, {
    logger: (info) => {
      if (info.status === 'recognizing text' && onProgression) {
        onProgression(info.progress);
      }
    }
  });

  try {
    const { data } = await worker.recognize(canvas);

    // Découper le texte OCR brut en lignes et nettoyer
    const lignes = (data.text || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    return lignes;
  } finally {
    // Terminaison propre du worker Tesseract pour libérer la mémoire
    await worker.terminate();
  }
}

/**
 * Pipeline OCR complet pour une liste de pages « vides de texte » d'un document PDF.
 *
 * @param {Object} pdfDoc - Le document PDF ouvert (retourné par extraireTextePDF).
 * @param {number[]} numPagesSansTexte - Numéros (1-indexed) des pages à traiter par OCR.
 * @param {function} [onProgression] - Callback (pageTraitee, totalPages, progressionOcrPage).
 * @returns {Promise<Map<number, string[]>>} Map de numéro de page → lignes OCR.
 */
export async function ocrPagesManquantes(pdfDoc, numPagesSansTexte, onProgression) {
  const resultats = new Map();

  for (let i = 0; i < numPagesSansTexte.length; i++) {
    const numPage = numPagesSansTexte[i];
    const page = await pdfDoc.getPage(numPage);
    const canvas = await rendreImagePage(page);

    const lignes = await ocrImagePage(canvas, (progress) => {
      if (onProgression) {
        onProgression(i + 1, numPagesSansTexte.length, progress);
      }
    });

    resultats.set(numPage, lignes);

    // Libérer le canvas immédiatement pour économiser la mémoire
    canvas.width = 0;
    canvas.height = 0;
  }

  return resultats;
}
