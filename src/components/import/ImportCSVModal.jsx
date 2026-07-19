import React, { useState, useRef, useEffect } from 'react';
import { useImportCSV } from '../../hooks/useImportCSV';
import { useImportTemplates } from '../../hooks/useImportTemplates';
import MapperVisuelCSV from './MapperVisuelCSV';
import EcranRevueImport from './EcranRevueImport';
import { X, Upload, FileSpreadsheet, FileText, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { parserCSVBrut } from '../../utils/csvParser';
import { normaliserLigne } from '../../utils/normalisationTransactions';
import { useComptes } from '../../hooks/useComptes';

/**
 * ImportCSVModal
 * Composant de haut niveau orchestrant le processus complet d'importation CSV.
 * 
 * @param {string} compteId - ID du compte bancaire sélectionné.
 * @param {function} onFerme - Callback de fermeture du modal.
 */
export default function ImportCSVModal({ compteId, onFerme }) {
  const { comptes } = useComptes();
  const [selectedCompteId, setSelectedCompteId] = useState(compteId || '');
  const [etape, setEtape] = useState('upload'); // 'upload' | 'mapping' | 'revue' | 'termine'
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Fichier en cours de traitement
  const [fichierContenuText, setFichierContenuText] = useState('');

  // Résultats du parsing intermédiaire
  const [headersCSV, setHeadersCSV] = useState([]);
  const [lignesApercuCSV, setLignesApercuCSV] = useState([]);
  const [transactionsNormalisees, setTransactionsNormalisees] = useState([]);
  const [banqueNomDetecte, setBanqueNomDetecte] = useState(null);

  // État spécifique PDF
  const [sourceType, setSourceType] = useState('csv'); // 'csv' | 'pdf'
  const [progressionPDF, setProgressionPDF] = useState(''); // message de progression

  const fileInputRef = useRef(null);
  const { parseFichier } = useImportCSV();
  const { chargerTemplates, sauvegarderTemplate } = useImportTemplates();
  const [templatesSauvegardes, setTemplatesSauvegardes] = useState([]);

  // Charger les templates sauvegardés de l'utilisateur au montage
  useEffect(() => {
    async function recupererTemplates() {
      const list = await chargerTemplates();
      setTemplatesSauvegardes(list);
    }
    recupererTemplates();
  }, [chargerTemplates, etape]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      traiterFichierSelectionne(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      traiterFichierSelectionne(e.target.files[0]);
    }
  };

  // Lecture et traitement initial du fichier (CSV ou PDF)
  const traiterFichierSelectionne = async (file) => {
    if (!file) return;
    setLoading(true);
    setErreur('');
    setProgressionPDF('');

    const estPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (estPDF) {
      setSourceType('pdf');
      await traiterFichierPDF(file);
    } else {
      setSourceType('csv');
      await traiterFichierCSV(file);
    }
  };

  // Traitement d'un fichier CSV
  const traiterFichierCSV = async (file) => {
    try {
      const fileText = await lireFichierTexte(file);
      setFichierContenuText(fileText);

      const res = await parseFichier(file, selectedCompteId);

      if (res.nonReconnu) {
        const parsingBrut = parserCSVBrut(fileText);
        setHeadersCSV(parsingBrut.headers);
        const lignesApercu = parsingBrut.lignes.slice(0, 4).map(ligne => 
          parsingBrut.headers.map(h => ligne[h] || '')
        );
        setLignesApercuCSV(lignesApercu);
        setEtape('mapping');
      } else {
        setBanqueNomDetecte(res.banqueDetectee);
        setTransactionsNormalisees(res.transactions);
        setEtape('revue');
      }
    } catch (err) {
      setErreur(err.message || "Erreur de traitement du fichier CSV.");
    } finally {
      setLoading(false);
    }
  };

  // Traitement d'un fichier PDF
  const traiterFichierPDF = async (file) => {
    try {
      // 1. Import dynamique de l'extracteur de texte natif
      setProgressionPDF('Chargement du moteur PDF…');
      const { extraireTextePDF } = await import('../../utils/pdfTextExtractor');

      // 2. Extraction du texte natif page par page
      const { pages, pdfDoc } = await extraireTextePDF(file, (pageTraitee, total) => {
        setProgressionPDF(`Extraction du texte : page ${pageTraitee}/${total}`);
      });

      // 3. Identifier les pages nécessitant un OCR
      const pagesSansTexte = pages.filter(p => p.videDeTexte).map(p => p.pageNum);
      let lignesOCR = new Map();

      if (pagesSansTexte.length > 0) {
        setProgressionPDF(`OCR en cours sur ${pagesSansTexte.length} page(s) scannée(s)…`);
        const { ocrPagesManquantes } = await import('../../utils/pdfOcrExtractor');

        lignesOCR = await ocrPagesManquantes(pdfDoc, pagesSansTexte, (pageOcr, totalOcr, progress) => {
          const pct = Math.round(progress * 100);
          setProgressionPDF(`OCR page ${pageOcr}/${totalOcr} — ${pct}%`);
        });
      }

      // 4. Fusionner les lignes (texte natif + OCR) dans l'ordre des pages
      const toutesLesLignes = [];
      for (const page of pages) {
        if (page.videDeTexte && lignesOCR.has(page.pageNum)) {
          toutesLesLignes.push(...lignesOCR.get(page.pageNum));
        } else {
          toutesLesLignes.push(...page.lignes);
        }
      }

      if (toutesLesLignes.length === 0) {
        throw new Error('Aucun texte exploitable n\'a pu être extrait de ce PDF.');
      }

      // 5. Détection heuristique des transactions
      setProgressionPDF('Détection des transactions…');
      const { detecterTransactionsPDF } = await import('../../utils/detectionLignesPDF');
      const transactions = await detecterTransactionsPDF(toutesLesLignes, selectedCompteId);

      if (transactions.length === 0) {
        throw new Error('Aucune transaction n\'a été détectée dans ce PDF. Vérifiez que le fichier est bien un relevé bancaire.');
      }

      setBanqueNomDetecte(pagesSansTexte.length > 0 ? 'PDF scanné (OCR)' : 'PDF natif');
      setTransactionsNormalisees(transactions);
      setEtape('revue');
    } catch (err) {
      setErreur(err.message || 'Erreur de traitement du fichier PDF.');
    } finally {
      setProgressionPDF('');
      setLoading(false);
    }
  };

  // Helper asynchrone pour lire un fichier sous forme de chaîne UTF-8 ou ISO
  const lireFichierTexte = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = () => reject(new Error("Erreur de lecture physique du fichier."));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Traitement du retour du Mapper Visuel de secours
  const handleMappingValide = async ({ colonnes, nomTemplate }) => {
    setLoading(true);
    setErreur('');
    try {
      // Si sauvegarde de template demandée
      if (nomTemplate) {
        const saved = await sauvegarderTemplate(nomTemplate, { colonnes });
        if (!saved.success) {
          console.error("Impossible de sauvegarder le template d'import:", saved.error);
        }
      }

      // Construction de la signature à la volée basée sur le mapping choisi
      const signatureALaVolee = {
        nom: nomTemplate || 'Format personnalisé',
        colonnes: {
          date: null,
          libelle: null,
          montant: null,
          debit: null,
          credit: null
        },
        format_date: 'JJ/MM/AAAA' // Valeur générique par défaut
      };

      // Configuration de la correspondance
      Object.entries(colonnes).forEach(([colIdx, typeChamp]) => {
        if (typeChamp === 'ignorer') return;
        const colHeader = headersCSV[Number.parseInt(colIdx, 10)];
        if (typeChamp === 'date') signatureALaVolee.colonnes.date = colHeader;
        if (typeChamp === 'description') signatureALaVolee.colonnes.libelle = colHeader;
        if (typeChamp === 'montant') signatureALaVolee.colonnes.montant = colHeader;
        if (typeChamp === 'debit') signatureALaVolee.colonnes.debit = colHeader;
        if (typeChamp === 'credit') signatureALaVolee.colonnes.credit = colHeader;
      });

      // Parser les lignes et normaliser
      const parsingBrut = parserCSVBrut(fichierContenuText);
      const normalisees = [];

      for (const ligne of parsingBrut.lignes) {
        if (ligne[signatureALaVolee.colonnes.date] && ligne[signatureALaVolee.colonnes.libelle]) {
          const tx = await normaliserLigne(ligne, signatureALaVolee, selectedCompteId);
          normalisees.push(tx);
        }
      }

      setBanqueNomDetecte(signatureALaVolee.nom);
      setTransactionsNormalisees(normalisees);
      setEtape('revue');
    } catch (err) {
      setErreur("Erreur lors de la normalisation manuelle : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Traiter l'application d'un template existant
  const handleSelectTemplate = async (template) => {
    if (!fichierInputPret()) return;
    // On force l'input file à s'ouvrir, puis on appliquera le mapping du template
    fileInputRef.current?.click();
    // Sauvegarde temporaire du template sélectionné
    window.__pendingTemplateImport = template;
  };

  const handleFileChangeWithTemplate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const template = window.__pendingTemplateImport;
    window.__pendingTemplateImport = null;

    setFichier(file);
    setLoading(true);
    setErreur('');
    try {
      const fileText = await lireFichierTexte(file);
      setFichierContenuText(fileText);

      // Extraction des en-têtes et application directe du template
      const parsingBrut = parserCSVBrut(fileText);
      setHeadersCSV(parsingBrut.headers);

      await handleMappingValide({
        colonnes: template.mapping_config.colonnes,
        nomTemplate: template.nom_template
      });
    } catch (err) {
      setErreur("Erreur lors du traitement avec template : " + err.message);
      setLoading(false);
    }
  };

  const fichierInputPret = () => {
    if (!selectedCompteId) {
      setErreur("Veuillez sélectionner un compte de destination.");
      return false;
    }
    return true;
  };

  const handleCloseClick = () => {
    if (etape === 'revue') {
      if (window.confirm("Vos modifications manuelles et l'import en cours seront perdus. Confirmer la fermeture ?")) {
        onFerme();
      }
    } else {
      onFerme();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header du modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0a0f1d]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${sourceType === 'pdf' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {sourceType === 'pdf' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">
                Importateur de relevés bancaires
              </h2>
              {banqueNomDetecte && etape === 'revue' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {sourceType === 'pdf' ? 'Source' : 'Banque'} : {banqueNomDetecte}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleCloseClick}
            className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-[#161b2c] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps du modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0a0f1d] text-slate-300">
          {erreur && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex gap-2">
              <AlertTriangle className="shrink-0" />
              <div>{erreur}</div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="animate-spin text-emerald-400" size={32} />
              <p className="text-slate-400 text-sm">
                {progressionPDF || 'Traitement du fichier…'}
              </p>
            </div>
          ) : (
            <>
              {/* Étape 1 : UPLOAD */}
              {etape === 'upload' && (
                <div className="space-y-6">
                  <div className="bg-[#161b2c] p-4 rounded-xl border border-slate-800">
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Compte bancaire de destination <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedCompteId}
                      onChange={(e) => setSelectedCompteId(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Choisir le compte associé --</option>
                      {comptes.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (fichierInputPret()) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
                      dragActive
                        ? 'border-emerald-400 bg-emerald-500/5'
                        : 'border-slate-800 hover:bg-[#161b2c]/30'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={window.__pendingTemplateImport ? handleFileChangeWithTemplate : handleFileChange}
                      accept=".csv,.pdf"
                      className="hidden"
                    />
                    <Upload className="text-slate-400 mb-4" size={40} />
                    <p className="text-white font-medium text-sm mb-1">
                      Glissez-déposez votre relevé bancaire ici
                    </p>
                    <p className="text-slate-400 text-xs">
                      CSV ou PDF — cliquez pour parcourir vos fichiers
                    </p>
                  </div>

                  {/* Formats de template sauvegardés */}
                  {templatesSauvegardes.length > 0 && (
                    <div className="bg-[#161b2c] rounded-xl p-4 border border-slate-850 space-y-3">
                      <h3 className="font-semibold text-xs text-slate-300">
                        Vos formats sauvegardés
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {templatesSauvegardes.map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => handleSelectTemplate(tpl)}
                            className="bg-[#0a0f1d] border border-slate-800 text-xs hover:border-emerald-400 text-slate-200 font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet size={12} className="text-emerald-400" />
                            {tpl.nom_template}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 bg-[#161b2c]/35 p-3.5 rounded-lg border border-slate-800 leading-relaxed">
                    <strong>Banques prises en charge d'office (CSV) :</strong> BNP Paribas, Boursorama, Crédit Agricole, Société Générale, Crédit Mutuel, Fortuneo, Revolut.<br />
                    <em>Tout autre relevé CSV est accepté : vous pourrez mapper manuellement ses colonnes.</em><br />
                    <strong className="text-indigo-400">Nouveau :</strong> les relevés PDF (texte ou scannés) sont aussi pris en charge avec extraction automatique.
                  </div>
                </div>
              )}

              {/* Étape 2 : MAPPING VISUEL DE SECOURS */}
              {etape === 'mapping' && (
                <MapperVisuelCSV
                  headers={headersCSV}
                  lignesApercu={lignesApercuCSV}
                  onMappingValide={handleMappingValide}
                  onAnnuler={() => setEtape('upload')}
                />
              )}

              {/* Étape 3 : REVUE ET CATÉGORISATION */}
              {etape === 'revue' && (
                <EcranRevueImport
                  transactionsParsees={transactionsNormalisees}
                  banqueDetectee={banqueNomDetecte}
                  compteId={selectedCompteId}
                  sourceType={sourceType}
                  onTermine={() => setEtape('termine')}
                  onAnnuler={() => setEtape('upload')}
                />
              )}

              {/* Étape 4 : SUCCÈS */}
              {etape === 'termine' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                    <Check size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Importation complétée !</h3>
                    <p className="text-slate-400 text-xs">
                      Vos transactions ont été importées et intégrées dans votre budget Fondora.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onFerme}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
                  >
                    Fermer l'importateur
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
