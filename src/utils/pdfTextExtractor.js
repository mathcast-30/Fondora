/**
 * pdfTextExtractor.js
 * Extraction du texte natif d'un fichier PDF page par page,
 * avec reconstruction des lignes logiques par proximité géométrique (Y).
 *
 * Fonctionne 100 % côté navigateur via pdfjs-dist.
 */

import { configurerPdfWorker } from '../lib/pdfWorkerConfig';

/** Seuil de tolérance verticale (en points PDF) pour regrouper des segments sur la même ligne. */
const TOLERANCE_Y_DEFAUT = 3;

/** Nombre minimum de caractères de texte natif par page pour qu'elle soit jugée « non vide ». */
const SEUIL_TEXTE_MIN = 20;

/**
 * Charge dynamiquement pdfjs-dist et configure son worker.
 * @returns {Promise<Object>} Le module pdfjsLib initialisé.
 */
async function chargerPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  configurerPdfWorker(pdfjsLib);
  return pdfjsLib;
}

/**
 * Extrait le texte natif de toutes les pages d'un fichier PDF.
 *
 * @param {File} file - Le fichier PDF sélectionné par l'utilisateur.
 * @param {function} [onProgression] - Callback optionnel (pageTraitee, totalPages).
 * @returns {Promise<{ pages: Array<{ pageNum: number, lignes: string[], videDeTexte: boolean }>, pdfDoc: Object }>}
 *   - pages : tableau d'objets par page avec les lignes reconstruites.
 *   - pdfDoc : le document PDF ouvert (réutilisable pour le fallback OCR).
 */
export async function extraireTextePDF(file, onProgression) {
  const pdfjsLib = await chargerPdfjs();

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdfDoc.numPages;

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    const items = textContent.items
      .filter(item => item.str && item.str.trim().length > 0)
      .map(item => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width
      }));

    const videDeTexte = estPageVideDeTexte(items);
    const lignes = videDeTexte ? [] : reconstruireLignes(items);

    pages.push({ pageNum: i, lignes, videDeTexte });

    if (onProgression) {
      onProgression(i, totalPages);
    }
  }

  return { pages, pdfDoc };
}

/**
 * Détermine si une page est « vide » de texte exploitable (= scannée / image).
 *
 * @param {Array<{str: string}>} items - Segments de texte extraits de la page.
 * @returns {boolean} true si la page nécessite un traitement OCR.
 */
export function estPageVideDeTexte(items) {
  const totalChars = items.reduce((acc, item) => acc + item.str.trim().length, 0);
  return totalChars < SEUIL_TEXTE_MIN;
}

/**
 * Regroupe et trie les segments de texte par ligne logique,
 * en utilisant la coordonnée Y comme critère de regroupement.
 *
 * @param {Array<{str: string, x: number, y: number, width: number}>} items - Segments de texte.
 * @param {number} [toleranceY] - Tolérance en points pour considérer deux segments sur la même ligne.
 * @returns {string[]} Tableau de chaînes, une par ligne logique reconstruite.
 */
export function reconstruireLignes(items, toleranceY = TOLERANCE_Y_DEFAUT) {
  if (!items || items.length === 0) return [];

  // Tri par Y décroissant (haut de page en premier), puis par X croissant (gauche à droite)
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) <= toleranceY) {
      return a.x - b.x;
    }
    return b.y - a.y; // Y décroissant car le PDF a l'origine en bas-gauche
  });

  const lignes = [];
  let ligneEnCours = [];
  let yEnCours = sorted[0].y;

  for (const item of sorted) {
    if (Math.abs(item.y - yEnCours) <= toleranceY) {
      // Même ligne logique
      ligneEnCours.push(item.str);
    } else {
      // Nouvelle ligne
      lignes.push(ligneEnCours.join(' ').trim());
      ligneEnCours = [item.str];
      yEnCours = item.y;
    }
  }

  // Dernière ligne
  if (ligneEnCours.length > 0) {
    lignes.push(ligneEnCours.join(' ').trim());
  }

  // Filtrer les lignes vides résiduelles
  return lignes.filter(l => l.length > 0);
}
