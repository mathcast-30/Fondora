import { useState, useRef, useEffect } from 'react';
import { useImportCSV } from '../hooks/useImportCSV';
import { supabase } from '../lib/supabase';
import { X, Upload, Check, AlertTriangle, FileSpreadsheet, RefreshCw, Trash2, Folder, CreditCard } from 'lucide-react';

function getSignificantWord(libelle) {
  if (!libelle) return '';
  const clean = libelle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).map(w => w.trim()).filter(w => w.length > 3);
  return words[0] || libelle.slice(0, 10);
}

export default function ImportCSVModal({ isOpen, onClose, categories = [], comptes = [], onImportSuccess }) {

  const {
    etape,
    banqueDetectee,
    transactionsBrutes,
    transactionsRevue,
    doublonsCount,
    loading,
    erreur,
    mappingActuel,
    importTemplates,
    chargerFichier,
    validerMapping,
    toggleSelectionTx,
    toutSelectionner,
    toutDeselectionner,
    changerCategorieLot,
    changerCompteLot,
    supprimerDeLImport,
    confirmerImport,
    sauvegarderTemplate,
    reinitialiser,
    setTransactionsRevue
  } = useImportCSV();

  const fileInputRef = useRef(null);
  const [compteSelectionne, setCompteSelectionne] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // States pour le Mapper Visuel
  const [selectedMapping, setSelectedMapping] = useState({ date: '', libelle: '', montant: '', debit: '', credit: '' });
  const [sauvegarderFormat, setSauvegarderFormat] = useState(false);
  const [nomTemplate, setNomTemplate] = useState('');

  // States pour la création de règle de catégorisation automatique
  const [reglePopup, setReglePopup] = useState(null);

  // Initialisation du compte par défaut
  useEffect(() => {
    if (comptes.length > 0 && !compteSelectionne) {
      setCompteSelectionne(comptes[0].id);
    }
  }, [comptes, compteSelectionne]);

  // Réinitialiser les états locaux du mapping quand l'étape change vers mapping
  useEffect(() => {
    if (etape === 'mapping' && transactionsBrutes.length > 0) {
      const headers = Object.keys(transactionsBrutes[0] || {});
      // Guess simple mapping based on headers
      const guess = { date: '', libelle: '', montant: '', debit: '', credit: '' };
      headers.forEach(h => {
        const clean = h.toLowerCase();
        if (clean.includes('date')) guess.date = h;
        else if (clean.includes('libel') || clean.includes('desc') || clean.includes('oper')) guess.libelle = h;
        else if (clean.includes('montant') || clean.includes('amount') || clean.includes('valeur')) guess.montant = h;
        else if (clean.includes('debit')) guess.debit = h;
        else if (clean.includes('credit')) guess.credit = h;
      });
      setSelectedMapping(guess);
    }
  }, [etape, transactionsBrutes]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      chargerFichier(e.dataTransfer.files[0], compteSelectionne);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      chargerFichier(e.target.files[0], compteSelectionne);
    }
  };

  const executeMapping = async () => {
    if (!selectedMapping.date || !selectedMapping.libelle || (!selectedMapping.montant && (!selectedMapping.debit || !selectedMapping.credit))) {
      alert("Veuillez mapper au moins la Date, le Libellé et soit le Montant direct soit les colonnes Débit et Crédit.");
      return;
    }
    if (sauvegarderFormat) {
      if (!nomTemplate.trim()) {
        alert("Veuillez saisir un nom pour votre template.");
        return;
      }
      await sauvegarderTemplate(nomTemplate, selectedMapping);
    }
    await validerMapping(selectedMapping, compteSelectionne);
  };

  const handleSelectTemplate = (template) => {
    if (!compteSelectionne) {
      alert("Veuillez d'abord sélectionner un compte.");
      return;
    }
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
      chargerFichier(fileInputRef.current.files[0], compteSelectionne);
      // after loading, we can apply template:
      // wait, the process will parse, then check bank. If not detected, we can apply template.
      // We will store the template to apply:
      setTimeout(() => {
        validerMapping(template.mapping_config, compteSelectionne);
      }, 500);
    } else {
      alert("Veuillez d'abord glisser-déposer ou sélectionner un fichier CSV.");
    }
  };

  // Gestion des changements de catégorie en ligne dans la revue
  const handleCategorieChange = (txId, newCatId, libelle) => {
    setTransactionsRevue(prev =>
      prev.map(tx => tx.id === txId ? { ...tx, categorie_id: newCatId } : tx)
    );

    if (newCatId) {
      const motCle = getSignificantWord(libelle);
      if (motCle) {
        setReglePopup({
          libelle,
          categorie_id: newCatId,
          mot_cle: motCle
        });
      }
    }
  };

  const creerRegleAutomatique = async () => {
    if (!reglePopup) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('smart_rules').insert({
          user_id: user.id,
          mot_cle: reglePopup.mot_cle,
          categorie_id: reglePopup.categorie_id,
          priorite: 1
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReglePopup(null);
    }
  };

  // Calculs pour la revue
  const selectedTxs = transactionsRevue.filter(tx => tx.selectionne && !tx.doublon);
  const totalImportReady = transactionsRevue.filter(tx => !tx.doublon).length;
  const aCategoriser = transactionsRevue.filter(tx => !tx.doublon && !tx.categorie_id).length;

  const handleConfirm = async () => {
    const { error } = await confirmerImport();
    if (!error && onImportSuccess) {
      onImportSuccess();
    }
  };

  // Rendu de l'écran 1 : UPLOAD
  const renderUpload = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-300 mb-2">Sélectionnez le compte de destination</label>
          <select
            value={compteSelectionne}
            onChange={(e) => setCompteSelectionne(e.target.value)}
            className="w-full bg-[#122a44] border border-[#1e3a5f] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-light"
          >
            {comptes.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.devise || 'EUR'})</option>
            ))}
          </select>
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
          dragActive ? 'border-emerald-light bg-[#122a44]' : 'border-[#1e3a5f] hover:bg-[#122a44]/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        <Upload className="text-gray-400 mb-4" size={48} />
        <p className="text-white font-medium text-lg mb-2">Glissez-déposez votre fichier CSV ici</p>
        <p className="text-gray-400 text-sm">ou cliquez pour parcourir vos fichiers</p>
      </div>

      {importTemplates.length > 0 && (
        <div className="bg-[#122a44] rounded-xl p-4 border border-[#1e3a5f] space-y-3">
          <h3 className="font-semibold text-sm text-gray-300">Vos formats sauvegardés</h3>
          <div className="flex flex-wrap gap-2">
            {importTemplates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="bg-[#0a1f33] border border-[#1e3a5f] text-xs hover:border-emerald-light text-white font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet size={14} className="text-emerald-light" />
                {tpl.nom_template}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 bg-[#122a44]/30 p-3 rounded-lg border border-[#1e3a5f]/40 leading-relaxed">
        <strong>Formats supportés :</strong> BNP Paribas, Boursorama, Crédit Agricole, Société Générale, Crédit Mutuel, Fortuneo, Revolut — et tout autre format via le mapper visuel intelligent.
      </div>
    </div>
  );

  // Rendu de l'écran 2 : MAPPER VISUEL
  const renderMapping = () => {
    const headers = Object.keys(transactionsBrutes[0] || {});
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Configuration du format d'import</h3>
          <p className="text-gray-400 text-sm">Nous n'avons pas détecté automatiquement le format. Veuillez lier chaque colonne correspondante ci-dessous.</p>
        </div>

        <div className="overflow-x-auto border border-[#1e3a5f] rounded-xl bg-[#122a44]">
          <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
            <thead className="bg-[#0a1f33] border-b border-[#1e3a5f]">
              <tr>
                {headers.map(h => (
                  <th key={h} className="p-3">
                    <div className="space-y-2">
                      <div className="truncate text-xs font-semibold text-gray-400" title={h}>{h}</div>
                      <select
                        value={
                          selectedMapping.date === h ? 'date' :
                          selectedMapping.libelle === h ? 'libelle' :
                          selectedMapping.montant === h ? 'montant' :
                          selectedMapping.debit === h ? 'debit' :
                          selectedMapping.credit === h ? 'credit' : 'ignorer'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMapping(prev => {
                            const clone = { ...prev };
                            // Remove previous assignment for this field
                            if (val === 'ignorer') {
                              if (clone.date === h) clone.date = '';
                              if (clone.libelle === h) clone.libelle = '';
                              if (clone.montant === h) clone.montant = '';
                              if (clone.debit === h) clone.debit = '';
                              if (clone.credit === h) clone.credit = '';
                            } else {
                              // Reset whatever was set to this val
                              if (clone.date === h) clone.date = '';
                              if (clone.libelle === h) clone.libelle = '';
                              if (clone.montant === h) clone.montant = '';
                              if (clone.debit === h) clone.debit = '';
                              if (clone.credit === h) clone.credit = '';

                              if (val === 'date') clone.date = h;
                              if (val === 'libelle') clone.libelle = h;
                              if (val === 'montant') { clone.montant = h; clone.debit = ''; clone.credit = ''; }
                              if (val === 'debit') { clone.debit = h; clone.montant = ''; }
                              if (val === 'credit') { clone.credit = h; clone.montant = ''; }
                            }
                            return clone;
                          });
                        }}
                        className="w-full bg-[#0a1f33] border border-[#1e3a5f] text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-emerald-light"
                      >
                        <option value="ignorer">Ignorer la colonne</option>
                        <option value="date">Date</option>
                        <option value="libelle">Libellé / Description</option>
                        <option value="montant">Montant (colonne unique)</option>
                        <option value="debit">Débit (dépenses)</option>
                        <option value="credit">Crédit (revenus)</option>
                      </select>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactionsBrutes.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b border-[#1e3a5f]/50 hover:bg-[#1e3a5f]/20">
                  {headers.map(h => (
                    <td key={h} className="p-3 truncate max-w-[180px]" title={row[h]}>
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#122a44] border border-[#1e3a5f] rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="save-template"
              checked={sauvegarderFormat}
              onChange={(e) => setSauvegarderFormat(e.target.checked)}
              className="w-4 h-4 text-emerald bg-[#0a1f33] border-[#1e3a5f] rounded focus:ring-0"
            />
            <label htmlFor="save-template" className="text-sm font-semibold text-white cursor-pointer select-none">
              Sauvegarder ce format d'import pour mes prochains fichiers
            </label>
          </div>

          {sauvegarderFormat && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400">Nom de votre format (ex: Crédit Agricole Pro)</label>
              <input
                type="text"
                value={nomTemplate}
                onChange={(e) => setNomTemplate(e.target.value)}
                placeholder="Entrez un nom..."
                className="w-full md:w-1/2 bg-[#0a1f33] border border-[#1e3a5f] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-light"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={reinitialiser}
            className="px-4 py-2 border border-[#1e3a5f] hover:bg-[#122a44] text-white rounded-lg transition text-sm font-medium"
          >
            Retour
          </button>
          <button
            onClick={executeMapping}
            className="px-5 py-2.5 bg-emerald hover:bg-emerald-light text-white rounded-lg transition text-sm font-bold shadow-md"
          >
            Appliquer ce mapping
          </button>
        </div>
      </div>
    );
  };

  // Rendu de l'écran 3 : REVUE
  const renderRevue = () => {
    const selectedIds = transactionsRevue.filter(tx => tx.selectionne).map(tx => tx.id);
    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m);

    return (
      <div className="space-y-6">
        {/* En-tête de la revue */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Revue de votre import</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald/20 text-emerald border border-emerald/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                {totalImportReady} transaction(s) prête(s)
              </span>
              {aCategoriser > 0 && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-semibold animate-pulse">
                  {aCategoriser} à catégoriser
                </span>
              )}
              {doublonsCount > 0 && (
                <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                  {doublonsCount} doublon(s) ignoré(s)
                </span>
              )}
            </div>
          </div>
        </div>

        {doublonsCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-400 text-sm">
            <AlertTriangle className="shrink-0" />
            <div>
              <strong>Attention :</strong> {doublonsCount} transaction(s) déjà importée(s) précédemment ont été détectée(s) et décochée(s) d'office.
            </div>
          </div>
        )}

        {/* Tableau de revue */}
        <div className="overflow-y-auto max-h-[380px] border border-[#1e3a5f] rounded-xl bg-[#122a44]">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0a1f33] border-b border-[#1e3a5f] sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={transactionsRevue.length > 0 && transactionsRevue.filter(tx => !tx.doublon).every(tx => tx.selectionne)}
                    onChange={(e) => e.target.checked ? toutSelectionner() : toutDeselectionner()}
                    className="w-4 h-4 text-emerald bg-[#0a1f33] border-[#1e3a5f] rounded focus:ring-0"
                  />
                </th>
                <th className="p-3 text-xs font-semibold text-gray-400">Date</th>
                <th className="p-3 text-xs font-semibold text-gray-400">Libellé</th>
                <th className="p-3 text-xs font-semibold text-gray-400">Montant</th>
                <th className="p-3 text-xs font-semibold text-gray-400">Catégorie</th>
                <th className="p-3 text-xs font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactionsRevue.map((tx) => (
                <tr
                  key={tx.id}
                  className={`border-b border-[#1e3a5f]/50 hover:bg-[#1e3a5f]/20 ${
                    tx.doublon ? 'opacity-40 bg-[#0a1f33]/40' : ''
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={tx.selectionne}
                      disabled={tx.doublon}
                      onChange={() => toggleSelectionTx(tx.id)}
                      className="w-4 h-4 text-emerald bg-[#0a1f33] border-[#1e3a5f] rounded focus:ring-0"
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">{tx.date}</td>
                  <td className="p-3 truncate max-w-[200px]" title={tx.libelle}>
                    {tx.libelle}
                  </td>
                  <td className={`p-3 font-semibold text-xs whitespace-nowrap ${
                    tx.type === 'depense' ? 'text-rose-500' : 'text-emerald-light'
                  }`}>
                    {tx.type === 'depense' ? '-' : '+'}{formatMontant(Math.abs(tx.montant))}
                  </td>
                  <td className="p-3">
                    <select
                      value={tx.categorie_id || ''}
                      onChange={(e) => handleCategorieChange(tx.id, e.target.value, tx.libelle)}
                      className={`text-xs rounded-lg px-2.5 py-1.5 bg-[#0a1f33] border border-[#1e3a5f] focus:outline-none focus:border-emerald-light font-medium ${
                        tx.categorie_id
                          ? 'text-emerald border-emerald/30 bg-emerald/5'
                          : 'text-amber-400 border-amber-500/30 bg-amber-500/5'
                      }`}
                    >
                      <option value="">📂 Non catégorisé</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => supprimerDeLImport([tx.id])}
                      className="p-1 hover:text-rose-500 transition text-gray-400"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Popup discrète de création de règle de catégorisation */}
        {reglePopup && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#122a44] border border-[#1e3a5f] p-4 rounded-xl shadow-2xl max-w-sm space-y-3 animate-slide-up">
            <p className="text-white text-xs font-semibold">
              Créer une règle automatique ?
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Toujours associer les transactions contenant le mot clé <strong className="text-white">"{reglePopup.mot_cle}"</strong> à cette catégorie ?
            </p>
            <div className="flex gap-2 justify-end text-xs">
              <button
                onClick={() => setReglePopup(null)}
                className="px-2.5 py-1.5 text-gray-400 hover:text-white transition font-medium"
              >
                Non merci
              </button>
              <button
                onClick={creerRegleAutomatique}
                className="px-3 py-1.5 bg-emerald hover:bg-emerald-light text-white rounded-lg font-bold transition flex items-center gap-1"
              >
                <Check size={12} /> Oui, créer la règle
              </button>
            </div>
          </div>
        )}

        {/* Bandeau d'actions groupées (affiché si >= 2 cochés) */}
        {selectedIds.length >= 2 && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#122a44]/95 backdrop-blur border border-[#1e3a5f] rounded-xl px-5 py-3.5 shadow-2xl flex items-center gap-4 text-xs max-w-lg w-full justify-between">
            <span className="font-semibold text-white whitespace-nowrap">
              {selectedIds.length} sélectionnés
            </span>
            <div className="flex gap-2">
              <div className="relative group">
                <button className="flex items-center gap-1 bg-[#0a1f33] border border-[#1e3a5f] py-1.5 px-2.5 rounded-lg hover:border-emerald-light text-white">
                  <Folder size={12} /> Catégorie
                </button>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-0 bg-[#122a44] border border-[#1e3a5f] rounded-lg shadow-xl overflow-y-auto max-h-40 w-36 z-50">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => changerCategorieLot(c.id)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1e3a5f] text-gray-300 hover:text-white"
                    >
                      {c.nom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 bg-[#0a1f33] border border-[#1e3a5f] py-1.5 px-2.5 rounded-lg hover:border-emerald-light text-white">
                  <CreditCard size={12} /> Compte
                </button>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-0 bg-[#122a44] border border-[#1e3a5f] rounded-lg shadow-xl overflow-y-auto max-h-40 w-36 z-50">
                  {comptes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => changerCompteLot(c.id)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1e3a5f] text-gray-300 hover:text-white"
                    >
                      {c.nom}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Voulez-vous retirer ces ${selectedIds.length} transactions de l'import ?`)) {
                    supprimerDeLImport(selectedIds);
                  }
                }}
                className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 py-1.5 px-2.5 rounded-lg hover:bg-rose-500/20 text-rose-500"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={reinitialiser}
            className="px-4 py-2 border border-[#1e3a5f] hover:bg-[#122a44] text-white rounded-lg transition text-sm font-medium"
          >
            Recommencer
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTxs.length === 0}
            className={`px-5 py-2.5 rounded-lg transition text-sm font-bold shadow-md ${
              selectedTxs.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-emerald hover:bg-emerald-light text-white'
            }`}
          >
            Confirmer l'import de {selectedTxs.length} transaction(s)
          </button>
        </div>
      </div>
    );
  };

  // Rendu de l'écran 4 : SUCCÈS
  const renderSucces = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center animate-fade-in">
      <div className="w-16 h-16 bg-emerald/10 border-2 border-emerald-light text-emerald rounded-full flex items-center justify-center animate-bounce">
        <Check size={36} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Import réussi !</h3>
        <p className="text-gray-400 text-sm">Vos transactions sélectionnées ont été intégrées avec succès.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reinitialiser}
          className="px-4 py-2.5 bg-[#122a44] border border-[#1e3a5f] hover:border-emerald-light text-white font-semibold rounded-lg text-sm transition"
        >
          Importer un autre fichier
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-emerald hover:bg-emerald-light text-white font-bold rounded-lg text-sm shadow-md transition"
        >
          Voir mes transactions
        </button>
      </div>
    </div>
  );

  return (
    isOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0a1f33] border border-[#1e3a5f] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header du modal */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e3a5f]">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald/10 text-emerald-light p-2 rounded-lg">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">Importateur de relevés bancaires CSV</h2>
              {banqueDetectee && (
                <span className="text-[10px] bg-emerald/20 text-emerald-light px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Banque : {banqueDetectee}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition rounded-lg hover:bg-[#122a44]">
            <X size={20} />
          </button>
        </div>

        {/* Corps du modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0a1f33] text-gray-300">
          {erreur && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex gap-2">
              <AlertTriangle className="shrink-0" />
              <div>{erreur}</div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="animate-spin text-emerald-light" size={40} />
              <p className="text-gray-400 text-sm">Traitement en cours...</p>
            </div>
          ) : (
            <>
              {etape === 'upload' && renderUpload()}
              {etape === 'mapping' && renderMapping()}
              {etape === 'revue' && renderRevue()}
              {etape === 'succes' && renderSucces()}
            </>
          )}
        </div>
      </div>
    </div> : null
  );
}
