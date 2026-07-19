/**
 * pdfWorkerConfig.js
 * Configure le Web Worker de pdf.js pour Vite (dev & production).
 * 
 * Usage :
 *   import { configurerPdfWorker } from '../lib/pdfWorkerConfig';
 *   const pdfjsLib = await import('pdfjs-dist');
 *   configurerPdfWorker(pdfjsLib);
 */

/**
 * Configure le worker de pdf.js à l'aide de l'import URL Vite.
 * Doit être appelé UNE SEULE FOIS avant tout appel à pdfjsLib.getDocument().
 *
 * @param {Object} pdfjsLib - Le module pdfjs-dist importé dynamiquement.
 */
export function configurerPdfWorker(pdfjsLib) {
  // Utilisation du pattern d'URL Vite compatible dev + build production.
  // On charge le fichier worker directement depuis le package node_modules ;
  // Vite le résout en URL statique correcte au build.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}
