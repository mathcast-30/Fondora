import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import {
  detecterBanque,
  trouverLigneEntete,
  normaliserMontant,
  genererImportHash,
  appliquerSmartRules,
  BANK_SIGNATURES
} from '../utils/csvParser';

export function useImportCSV() {
  const [etape, setEtape] = useState('upload'); // 'upload' | 'mapping' | 'revue' | 'succes'
  const [banqueDetectee, setBanqueDetectee] = useState(null);
  const [transactionsBrutes, setTransactionsBrutes] = useState([]);
  const [transactionsRevue, setTransactionsRevue] = useState([]);
  const [doublonsCount, setDoublonsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [mappingActuel, setMappingActuel] = useState(null);
  const [importTemplates, setImportTemplates] = useState([]);
  const [rules, setRules] = useState([]);

  // Charger les règles de catégorisation et les templates
  const chargerDonnees = useCallback(async () => {
    try {
      const { data: rulesData } = await supabase
        .from('smart_rules')
        .select('*')
        .order('priorite', { ascending: true });
      if (rulesData) setRules(rulesData);

      const { data: templatesData } = await supabase
        .from('import_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (templatesData) setImportTemplates(templatesData);
    } catch (e) {
      console.error("Erreur lors du chargement des règles/templates:", e);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  // Réinitialiser tout le flux
  const reinitialiser = () => {
    setEtape('upload');
    setBanqueDetectee(null);
    setTransactionsBrutes([]);
    setTransactionsRevue([]);
    setDoublonsCount(0);
    setLoading(false);
    setErreur(null);
    setMappingActuel(null);
    chargerDonnees(); // recharger au cas où de nouvelles règles/templates ont été créées
  };

  // Traiter le mapping et générer la liste de revue
  const processMapping = async (parsedRows, mapping, compteId) => {
    setLoading(true);
    setErreur(null);
    setMappingActuel(mapping);

    try {
      const isDebitCredit = mapping.debit && mapping.credit;
      const mappedTxs = [];

      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const dateVal = row[mapping.date];
        const libelleVal = row[mapping.libelle];

        if (!dateVal || !libelleVal) continue;

        // Normalisation de la date en YYYY-MM-DD
        let formattedDate = String(dateVal).trim();
        const frDateMatch = formattedDate.match(/^(\d{2})[./-](\d{2})[./-](\d{4})/);
        if (frDateMatch) {
          formattedDate = `${frDateMatch[3]}-${frDateMatch[2]}-${frDateMatch[1]}`;
        } else {
          const frShortDateMatch = formattedDate.match(/^(\d{2})[./-](\d{2})[./-](\d{2})/);
          if (frShortDateMatch) {
            formattedDate = `20${frShortDateMatch[3]}-${frShortDateMatch[2]}-${frShortDateMatch[1]}`;
          }
        }

        const debitVal = isDebitCredit ? row[mapping.debit] : null;
        const creditVal = isDebitCredit ? row[mapping.credit] : null;
        const montantVal = !isDebitCredit ? row[mapping.montant] : null;

        const { montant, type } = isDebitCredit
          ? normaliserMontant(debitVal, creditVal)
          : normaliserMontant(montantVal, null);

        const tempId = `temp_${i}_${Date.now()}`;
        const hash = genererImportHash(formattedDate, libelleVal, montant, compteId);
        const guessedCatId = appliquerSmartRules(libelleVal, rules);

        mappedTxs.push({
          id: tempId,
          date: formattedDate,
          libelle: libelleVal,
          montant,
          type,
          categorie_id: guessedCatId,
          import_hash: hash,
          compte_id: compteId
        });
      }

      if (mappedTxs.length === 0) {
        setErreur("Aucune transaction valide n'a pu être extraite avec ce mapping.");
        setLoading(false);
        return;
      }

      // Détecter les doublons via une seule requête Supabase .in()
      const uniqueHashes = [...new Set(mappedTxs.map(t => t.import_hash))];
      let existingHashes = new Set();

      if (uniqueHashes.length > 0) {
        const { data: dbTxs, error: dbErr } = await supabase
          .from('transactions')
          .select('import_hash')
          .in('import_hash', uniqueHashes);

        if (!dbErr && dbTxs) {
          dbTxs.forEach(t => {
            if (t.import_hash) {
              existingHashes.add(t.import_hash);
            }
          });
        }
      }

      let dupCount = 0;
      const enrichedTxs = mappedTxs.map(tx => {
        const isDup = existingHashes.has(tx.import_hash);
        if (isDup) dupCount++;
        return {
          ...tx,
          doublon: isDup,
          selectionne: !isDup // Sélectionné par défaut si ce n'est pas un doublon
        };
      });

      setTransactionsRevue(enrichedTxs);
      setDoublonsCount(dupCount);
      setEtape('revue');
    } catch (e) {
      setErreur(e.message || "Erreur lors du traitement du mapping.");
    } finally {
      setLoading(false);
    }
  };

  // Charger le fichier CSV
  const chargerFichier = (file, compteId) => {
    if (!compteId) {
      setErreur("Veuillez sélectionner un compte avant de charger le fichier.");
      return;
    }
    setLoading(true);
    setErreur(null);
    setBanqueDetectee(null);

    Papa.parse(file, {
      skipEmptyLines: 'greedy',
      header: false,
      complete: (results) => {
        try {
          const rows = results.data;
          if (!rows || rows.length === 0) {
            setErreur("Le fichier CSV est vide.");
            setLoading(false);
            return;
          }

          const headerIndex = trouverLigneEntete(rows);
          const actualHeaderIndex = headerIndex === -1 ? 0 : headerIndex;

          const slicedRows = rows.slice(actualHeaderIndex);
          const csvString = Papa.unparse(slicedRows);

          Papa.parse(csvString, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: async (innerResults) => {
              try {
                const headers = innerResults.meta.fields || [];
                const detectedKey = detecterBanque(headers);
                setTransactionsBrutes(innerResults.data);

                if (detectedKey) {
                  setBanqueDetectee(detectedKey);
                  const sig = BANK_SIGNATURES[detectedKey];
                  await processMapping(innerResults.data, sig.mapping, compteId);
                } else {
                  setMappingActuel({
                    date: '',
                    libelle: '',
                    montant: '',
                    debit: '',
                    credit: ''
                  });
                  setEtape('mapping');
                  setLoading(false);
                }
              } catch (e) {
                setErreur(e.message || "Erreur lors de l'analyse structurelle du CSV.");
                setLoading(false);
              }
            },
            error: (err) => {
              setErreur(err.message || "Erreur de parsing interne.");
              setLoading(false);
            }
          });
        } catch (e) {
          setErreur(e.message || "Erreur de lecture du fichier.");
          setLoading(false);
        }
      },
      error: (err) => {
        setErreur(err.message || "Erreur de chargement du fichier.");
        setLoading(false);
      }
    });
  };

  // Appliquer un mapping manuel
  const validerMapping = async (mapping, compteId) => {
    await processMapping(transactionsBrutes, mapping, compteId);
  };

  // Sélectionner ou désélectionner une transaction
  const toggleSelectionTx = (id) => {
    setTransactionsRevue(prev =>
      prev.map(tx => tx.id === id ? { ...tx, selectionne: !tx.selectionne } : tx)
    );
  };

  // Tout cocher/décocher
  const toutSelectionner = () => {
    setTransactionsRevue(prev =>
      prev.map(tx => tx.doublon ? tx : { ...tx, selectionne: true })
    );
  };

  const toutDeselectionner = () => {
    setTransactionsRevue(prev =>
      prev.map(tx => ({ ...tx, selectionne: false }))
    );
  };

  // Modification en lot
  const changerCategorieLot = (categorieId) => {
    setTransactionsRevue(prev =>
      prev.map(tx => tx.selectionne ? { ...tx, categorie_id: categorieId } : tx)
    );
  };

  const changerCompteLot = (compteId) => {
    setTransactionsRevue(prev =>
      prev.map(tx => tx.selectionne ? { ...tx, compte_id: compteId } : tx)
    );
  };

  // Retirer de la revue d'import
  const supprimerDeLImport = (ids) => {
    const idsSet = new Set(ids);
    setTransactionsRevue(prev => prev.filter(tx => !idsSet.has(tx.id)));
  };

  // Confirmer et sauvegarder les transactions dans Supabase
  const confirmerImport = async () => {
    setLoading(true);
    setErreur(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      const activeTxs = transactionsRevue.filter(tx => tx.selectionne && !tx.doublon);

      if (activeTxs.length === 0) {
        setLoading(false);
        return { error: new Error("Aucune transaction valide sélectionnée pour l'import.") };
      }

      const toInsert = activeTxs.map(t => ({
        user_id: user.id,
        compte_id: t.compte_id,
        categorie_id: t.categorie_id || null,
        description: t.libelle,
        montant: Math.abs(t.montant),
        type: t.type,
        date: t.date,
        recurrente: false,
        source: 'import_csv',
        import_hash: t.import_hash
      }));

      const { error } = await supabase.from('transactions').insert(toInsert);

      if (error) throw error;

      setEtape('succes');
      return { error: null };
    } catch (e) {
      setErreur(e.message || "Erreur de sauvegarde des transactions.");
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  // Enregistrer le template pour ce format
  const sauvegarderTemplate = async (nomTemplate, mappingConfig) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      const { error } = await supabase
        .from('import_templates')
        .insert({
          user_id: user.id,
          nom_template: nomTemplate,
          mapping_config: mappingConfig
        });

      if (error) throw error;
      await chargerDonnees(); // recharger la liste des templates
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  return {
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
  };
}
