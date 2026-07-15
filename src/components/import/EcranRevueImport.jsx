import React, { useState, useEffect, useMemo } from 'react';
import { useCategoryPredictor } from '../../hooks/useCategoryPredictor';
import { useCategoriesResolver } from '../../hooks/useCategoriesResolver';
import { useBulkImportTransactions } from '../../hooks/useBulkImportTransactions';
import { Trash2, Folder, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * EcranRevueImport
 * Composant de revue interactive des transactions prêtes à être importées.
 */
export default function EcranRevueImport({
  transactionsParsees = [],
  banqueDetectee = null,
  compteId,
  sourceType = 'csv',
  onTermine,
  onAnnuler
}) {
  const [loading, setLoading] = useState(true);
  const [transactionsLocal, setTransactionsLocal] = useState([]);
  const [forcerLesDoublons, setForcerLesDoublons] = useState(false);
  const [importing, setImporting] = useState(false);
  const [erreurImport, setErreurImport] = useState('');
  const [modificationManuelleFaite, setModificationManuelleFaite] = useState(false);

  const { chargerSmartRulesUtilisateur, predictCategory } = useCategoryPredictor();
  const { resolveCategorieId, categoriesCache, loading: loadingResolver } = useCategoriesResolver();
  const { verifierDoublons, inserer } = useBulkImportTransactions();

  // Traiter les transactions au montage
  useEffect(() => {
    async function initialiserRevue() {
      try {
        setLoading(true);
        const smartRules = await chargerSmartRulesUtilisateur();

        // 1. Première passe de prédiction et de normalisation
        const transactionsEnrichies = [];
        let indexTemp = 0;

        for (const tx of transactionsParsees) {
          const predist = predictCategory(tx.description, smartRules);
          
          let categorieId = null;
          let statut = 'a_classer';

          if (predist.source === 'smart_rule') {
            categorieId = predist.categorie_id;
            statut = 'auto_smart_rule';
          } else if (predist.source === 'dictionnaire' && predist.label) {
            // Résolution asynchrone du libellé vers un ID UUID réel en base
            categorieId = await resolveCategorieId(predist.label, tx.type);
            statut = 'auto_dictionnaire';
          }

          transactionsEnrichies.push({
            id: `revue_${indexTemp++}`,
            date: tx.date,
            description: tx.description,
            montant: tx.montant,
            type: tx.type,
            import_hash: tx.import_hash,
            categorie_id: categorieId,
            statut: statut,
            confiance: tx.confiance || 'haute',
            doublon: false,
            selectionne: sourceType === 'pdf' && tx.confiance === 'moyenne' ? false : true,
            modificationManuelle: false
          });
        }

        // 2. Vérification des doublons contre la base de données
        const verification = await verifierDoublons(transactionsEnrichies, compteId);
        
        // Mettre à jour le statut des doublons détectés
        const finalTxs = transactionsEnrichies.map(tx => {
          const estDoublon = verification.doublons.some(d => d.import_hash === tx.import_hash);
          if (estDoublon) {
            return {
              ...tx,
              statut: 'doublon',
              doublon: true,
              selectionne: false // Décoché par défaut si doublon
            };
          }
          return tx;
        });

        setTransactionsLocal(finalTxs);
      } catch (err) {
        console.error("Erreur d'initialisation de l'écran de revue:", err);
      } finally {
        setLoading(false);
      }
    }

    if (compteId && transactionsParsees.length > 0) {
      initialiserRevue();
    }
  }, [transactionsParsees, compteId, chargerSmartRulesUtilisateur, predictCategory, resolveCategorieId, verifierDoublons]);

  // Déterminer s'il y a des doublons à afficher dans le bandeau supérieur
  const doublonsCount = useMemo(() => {
    return transactionsLocal.filter(tx => tx.doublon).length;
  }, [transactionsLocal]);

  // Transactions sélectionnées pour le comptage final
  const selectedTxs = useMemo(() => {
    return transactionsLocal.filter(tx => tx.selectionne);
  }, [transactionsLocal]);

  const selectedIds = useMemo(() => {
    return selectedTxs.map(tx => tx.id);
  }, [selectedTxs]);

  // Actions individuelles
  const toggleSelectionTx = (id) => {
    setTransactionsLocal(prev =>
      prev.map(tx => tx.id === id ? { ...tx, selectionne: !tx.selectionne } : tx)
    );
  };

  const handleCategorieChange = (id, newCatId) => {
    setModificationManuelleFaite(true);
    setTransactionsLocal(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          return {
            ...tx,
            categorie_id: newCatId || null,
            statut: newCatId ? 'manuel' : 'a_classer',
            modificationManuelle: true
          };
        }
        return tx;
      })
    );
  };

  // Actions de masse
  const toutSelectionner = (cocher) => {
    setTransactionsLocal(prev =>
      prev.map(tx => {
        // Si c'est un doublon, on respecte la volonté de forcer ou non
        if (tx.doublon && !forcerLesDoublons) {
          return { ...tx, selectionne: false };
        }
        return { ...tx, selectionne: cocher };
      })
    );
  };

  const changerCategorieLot = (catId) => {
    setModificationManuelleFaite(true);
    setTransactionsLocal(prev =>
      prev.map(tx => {
        if (tx.selectionne) {
          return {
            ...tx,
            categorie_id: catId || null,
            statut: catId ? 'manuel' : 'a_classer',
            modificationManuelle: true
          };
        }
        return tx;
      })
    );
  };

  const supprimerDeLImport = (idsToTrash) => {
    const idsSet = new Set(idsToTrash);
    setTransactionsLocal(prev => prev.filter(tx => !idsSet.has(tx.id)));
  };

  // Annulation
  const handleAnnuler = () => {
    if (modificationManuelleFaite) {
      if (window.confirm("Vous avez effectué des modifications manuelles. Êtes-vous sûr de vouloir annuler l'import ?")) {
        onAnnuler();
      }
    } else {
      onAnnuler();
    }
  };

  // Soumission finale en bulk
  const handleConfirmerImport = async () => {
    if (selectedTxs.length === 0) return;
    try {
      setImporting(true);
      setErreurImport('');

      // Appel de l'insertion en masse (filtrage ou non des doublons selon forcerLesDoublons)
      const res = await inserer(selectedTxs, compteId, { forcerDoublons: forcerLesDoublons });

      if (res.success) {
        onTermine();
      } else {
        setErreurImport(res.erreur || "Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      setErreurImport("Une erreur est survenue lors de l'import : " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Formatter monétaire
  const formatEuros = (val) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  };

  if (loading || loadingResolver) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">
          Analyse des transactions et prédiction des catégories...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages d'erreur */}
      {erreurImport && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex gap-2">
          <AlertTriangle className="shrink-0" />
          <div>{erreurImport}</div>
        </div>
      )}

      {/* Bandeau d'infos sur les doublons */}
      {doublonsCount > 0 && (
        <div className="bg-[#1c1917] border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500 text-xs">
          <AlertTriangle className="shrink-0" size={16} />
          <div>
            <span>
              {doublonsCount} transaction(s) déjà importée(s) précédemment ont été détectée(s) et ignorée(s).{' '}
            </span>
            <button
              type="button"
              onClick={() => {
                setForcerLesDoublons(true);
                // Sélectionne également les doublons automatiquement
                setTransactionsLocal(prev =>
                  prev.map(tx => (tx.doublon ? { ...tx, selectionne: true } : tx))
                );
              }}
              className="underline font-semibold hover:text-amber-400 cursor-pointer ml-1"
            >
              Les inclure quand même
            </button>
          </div>
        </div>
      )}

      {/* Bandeau d'avertissement PDF */}
      {sourceType === 'pdf' && (
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex gap-3 text-indigo-400 text-xs">
          <AlertCircle className="shrink-0" size={16} />
          <div>
            <span className="font-semibold">⚠️ Extraction PDF — à vérifier.</span>{' '}
            <span className="text-slate-400">
              Les montants et descriptions ont été extraits automatiquement. 
              Les lignes de confiance « moyenne » sont désélectionnées par défaut — cochez-les manuellement après vérification.
            </span>
          </div>
        </div>
      )}

      {/* Titre et sous-titre */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-white">
            Revue de votre import
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Vérifiez ou modifiez les catégories avant de confirmer l'import.
          </p>
        </div>
        {banqueDetectee && (
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase">
            Format : {banqueDetectee}
          </span>
        )}
      </div>

      {/* Tableau de revue */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0e1424] max-h-[350px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0a0f1d] border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    transactionsLocal.length > 0 &&
                    transactionsLocal.every(tx => tx.selectionne)
                  }
                  onChange={(e) => toutSelectionner(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 border-slate-700 bg-[#161b2c] accent-emerald-500 cursor-pointer"
                />
              </th>
              <th className="p-3 text-xs text-slate-400 uppercase font-medium">Date</th>
              <th className="p-3 text-xs text-slate-400 uppercase font-medium">Description</th>
              <th className="p-3 text-xs text-slate-400 uppercase font-medium">Montant</th>
              <th className="p-3 text-xs text-slate-400 uppercase font-medium">Catégorie</th>
              <th className="p-3 text-xs text-slate-400 uppercase font-medium w-12"></th>
            </tr>
          </thead>
          <tbody>
            {transactionsLocal.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                  Aucune transaction dans la liste de revue.
                </td>
              </tr>
            ) : (
              transactionsLocal.map((tx) => (
                <tr
                  key={tx.id}
                  className={`border-b border-slate-800 last:border-b-0 hover:bg-[#12182c] transition-colors ${
                    tx.doublon && !forcerLesDoublons ? 'opacity-40 bg-slate-900/30' : ''
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={tx.selectionne}
                      onChange={() => toggleSelectionTx(tx.id)}
                      className="w-4 h-4 rounded text-emerald-500 border-slate-700 bg-[#161b2c] accent-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-xs text-slate-300 whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="p-3 text-xs text-slate-200 truncate max-w-[220px]" title={tx.description}>
                    {tx.description}
                  </td>
                  <td className={`p-3 text-xs font-semibold whitespace-nowrap ${
                    tx.type === 'depense' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {tx.type === 'depense' ? '-' : '+'}{formatEuros(tx.montant)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <select
                        value={tx.categorie_id || ''}
                        onChange={(e) => handleCategorieChange(tx.id, e.target.value)}
                        className={`text-xs rounded-lg p-1.5 bg-[#161b2c] border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium ${
                          tx.categorie_id
                            ? 'text-emerald-400 border-emerald-500/20'
                            : 'text-slate-400'
                        }`}
                      >
                        <option value="">📂 À classer</option>
                        {categoriesCache.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nom} ({c.type === 'depense' ? 'Déb.' : 'Créd.'})
                          </option>
                        ))}
                      </select>

                      {/* Badges de statut */}
                      {tx.statut === 'auto_smart_rule' && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                          Règle
                        </span>
                      )}
                      {tx.statut === 'auto_dictionnaire' && (
                        <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 whitespace-nowrap">
                          Auto
                        </span>
                      )}
                      {tx.statut === 'doublon' && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                          Doublon
                        </span>
                      )}
                      {sourceType === 'pdf' && tx.confiance === 'moyenne' && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                          À vérifier
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => supprimerDeLImport([tx.id])}
                      className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Retirer de l'import"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Barre d'action de masse fixe */}
      {selectedIds.length >= 2 && (
        <div className="bg-[#12182c] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Actions de masse :</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {selectedIds.length} sélectionnées
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex items-center bg-[#161b2c] border border-slate-700 rounded-lg px-2 py-1">
              <Folder size={12} className="text-slate-400 mr-2" />
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    changerCategorieLot(e.target.value);
                    e.target.value = ''; // Reset select
                  }
                }}
                className="bg-transparent border-0 text-slate-200 text-xs focus:outline-none cursor-pointer pr-4"
              >
                <option value="">Changer catégorie...</option>
                {categoriesCache.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Voulez-vous retirer ces ${selectedIds.length} transactions de l'import ?`)) {
                  supprimerDeLImport(selectedIds);
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Retirer ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Actions de bas de page */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handleAnnuler}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Annuler l'import
        </button>

        <button
          type="button"
          onClick={handleConfirmerImport}
          disabled={selectedTxs.length === 0 || importing}
          className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
            selectedTxs.length === 0 || importing
              ? 'bg-slate-800 opacity-50 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02]'
          }`}
        >
          {importing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></div>
              <span>Importation...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              <span>Confirmer l'import de {selectedTxs.length} transaction(s)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
