import React, { useState, useEffect, useMemo } from 'react';
import { useCategoryPredictor } from '../../hooks/useCategoryPredictor';
import { useCategoriesResolver } from '../../hooks/useCategoriesResolver';
import { useBulkImportTransactions } from '../../hooks/useBulkImportTransactions';
import { Trash2, Folder, ShieldCheck, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [dettes, setDettes] = useState([]);
  const [rpcLoading, setRpcLoading] = useState(false);

  const { chargerSmartRulesUtilisateur, predictCategory } = useCategoryPredictor();
  const { resolveCategorieId, categoriesCache, loading: loadingResolver } = useCategoriesResolver();
  const { verifierDoublons, inserer } = useBulkImportTransactions();

  // Traiter les transactions au montage
  useEffect(() => {
    async function initialiserRevue() {
      try {
        setLoading(true);
        setRpcLoading(true);
        
        // Charger la liste des dettes
        const { data: dettesList } = await supabase.from('dettes').select('id, nom');
        setDettes(dettesList || []);

        const smartRules = await chargerSmartRulesUtilisateur();
        const { data: { user } } = await supabase.auth.getUser();

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
            modificationManuelle: false,
            dette_suggeree: null,
            dette_id: null,
            doublon_flou: false,
            doublon_flou_importer: null
          });
        }

        // 2. Vérification des doublons exacts contre la base de données
        const verification = await verifierDoublons(transactionsEnrichies, compteId);
        
        // Mettre à jour le statut des doublons détectés
        let tempTxs = transactionsEnrichies.map(tx => {
          const estDoublon = verification.doublons.some(d => d.import_hash === tx.import_hash);
          if (estDoublon) {
            return {
              ...tx,
              statut: 'doublon',
              doublon: true,
              selectionne: false // Décoché par défaut si doublon exact
            };
          }
          return tx;
        });

        // 3. Appels RPC en parallèle pour fn_matcher_dette et fn_detecter_doublons_import
        if (user) {
          const promises = tempTxs.map(async (tx) => {
            const updates = {};
            
            // fn_detecter_doublons_import
            try {
              const { data: dupData } = await supabase.rpc('fn_detecter_doublons_import', {
                user_id: user.id,
                date: tx.date,
                montant: tx.montant,
                categorie_id: tx.categorie_id,
                type: tx.type
              });
              if (dupData && dupData.length > 0) {
                updates.doublon_flou = true;
              }
            } catch (err) {
              console.error("Error in fn_detecter_doublons_import:", err);
            }

            // fn_matcher_dette pour mots-clés liés aux dettes
            const isDebtKeyword = /prlv|prelevement|credit|mensualite/i.test(tx.description);
            if (isDebtKeyword) {
              try {
                const { data: debtData } = await supabase.rpc('fn_matcher_dette', {
                  user_id: user.id,
                  libelle: tx.description,
                  montant: tx.montant
                });
                if (debtData && debtData.length > 0) {
                  updates.dette_suggeree = { id: debtData[0].id, nom: debtData[0].nom };
                }
              } catch (err) {
                console.error("Error in fn_matcher_dette:", err);
              }
            }

            return { id: tx.id, updates };
          });

          const results = await Promise.all(promises);
          tempTxs = tempTxs.map(tx => {
            const res = results.find(r => r.id === tx.id);
            return res ? { ...tx, ...res.updates } : tx;
          });
        }

        setTransactionsLocal(tempTxs);
      } catch (err) {
        console.error("Erreur d'initialisation de l'écran de revue:", err);
      } finally {
        setLoading(false);
        setRpcLoading(false);
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

  // Actions de liaison de dette
  const handleConfirmDette = (id, detteId) => {
    setTransactionsLocal(prev =>
      prev.map(tx => tx.id === id ? { ...tx, dette_id: detteId } : tx)
    );
  };

  const handleUnlinkDette = (id) => {
    setTransactionsLocal(prev =>
      prev.map(tx => tx.id === id ? { ...tx, dette_id: null } : tx)
    );
  };

  // Action sur décision de doublon potentiel (flou)
  const handleFuzzyDupDecision = (id, keep) => {
    setTransactionsLocal(prev =>
      prev.map(tx => tx.id === id ? { ...tx, doublon_flou_importer: keep, selectionne: keep } : tx)
    );
  };

  // Soumission finale en bulk
  const handleConfirmerImport = async () => {
    if (selectedTxs.length === 0 || !compteId) return;
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

  if (loading || loadingResolver || rpcLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">
          Analyse des transactions, détection des doublons flous et rapprochement des dettes...
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
                    (tx.doublon && !forcerLesDoublons) || tx.doublon_flou_importer === false ? 'opacity-40 bg-slate-900/30' : ''
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
                  <td className="p-3 text-xs text-slate-200 max-w-[220px]" title={tx.description}>
                    <div className="truncate">{tx.description}</div>
                    
                    {/* Dette section */}
                    {tx.dette_suggeree && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {tx.dette_id ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            💳 Dette associée : {tx.dette_suggeree.nom}
                            <button
                              type="button"
                              onClick={() => handleUnlinkDette(tx.id)}
                              className="text-rose-400 hover:text-rose-300 font-bold ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-[#161b2c] text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                            Association dette ? : {tx.dette_suggeree.nom}
                            <button
                              type="button"
                              onClick={() => handleConfirmDette(tx.id, tx.dette_suggeree.id)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-1 rounded font-bold"
                            >
                              Associer
                            </button>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Doublon flou section */}
                    {tx.doublon_flou && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ⚠️ Doublon potentiel
                          {tx.doublon_flou_importer === null ? (
                            <div className="flex gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => handleFuzzyDupDecision(tx.id, true)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] px-1 rounded font-bold"
                              >
                                Importer quand même
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFuzzyDupDecision(tx.id, false)}
                                className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1 rounded font-bold"
                              >
                                Ignorer
                              </button>
                            </div>
                          ) : tx.doublon_flou_importer ? (
                            <span className="text-emerald-400 font-semibold ml-1">(Conservé)</span>
                          ) : (
                            <span className="text-rose-400 font-semibold ml-1">(Ignoré)</span>
                          )}
                        </span>
                      </div>
                    )}
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
