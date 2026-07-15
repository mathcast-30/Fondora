import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBulkImportTransactions() {
  /**
   * Vérifie et identifie les transactions déjà importées à partir de leur import_hash.
   *
   * @param {Array} transactionsNormalisees - Liste des transactions normalisées.
   * @param {string} compteId - ID du compte bancaire cible.
   * @returns {Promise<{ aInserer: Array, doublons: Array, nombreDoublons: number }>}
   */
  const verifierDoublons = useCallback(async (transactionsNormalisees, compteId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { aInserer: transactionsNormalisees, doublons: [], nombreDoublons: 0 };
      }

      // Récupère tous les hashs non nuls de ce compte
      const { data, error } = await supabase
        .from('transactions')
        .select('import_hash')
        .eq('user_id', user.id)
        .eq('compte_id', compteId)
        .not('import_hash', 'is', null);

      if (error) {
        console.error("Erreur lors de la vérification des doublons:", error.message);
        return { aInserer: transactionsNormalisees, doublons: [], nombreDoublons: 0 };
      }

      const existingHashes = new Set((data || []).map(t => t.import_hash));
      const aInserer = [];
      const doublons = [];

      for (const tx of transactionsNormalisees) {
        if (tx.import_hash && existingHashes.has(tx.import_hash)) {
          doublons.push(tx);
        } else {
          aInserer.push(tx);
        }
      }

      return {
        aInserer,
        doublons,
        nombreDoublons: doublons.length
      };
    } catch (e) {
      console.error("Erreur inattendue lors de la détection de doublons:", e);
      return { aInserer: transactionsNormalisees, doublons: [], nombreDoublons: 0 };
    }
  }, []);

  /**
   * Réalise l'insertion en masse (Bulk Insert) des transactions.
   * Découpe automatiquement le lot en paquets de 500 transactions maximum pour optimiser.
   *
   * @param {Array} transactions - Liste des transactions à insérer.
   * @param {string} compteId - ID du compte de destination.
   * @param {Object} [options={}] - Options d'importation.
   * @param {boolean} [options.forcerDoublons=false] - Si faux, on filtrera les doublons détectés.
   * @returns {Promise<{ success: boolean, nombreInseres: number, erreur: string|null }>}
   */
  const inserer = useCallback(async (transactions, compteId, options = { forcerDoublons: false }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, nombreInseres: 0, erreur: "Utilisateur non connecté." };
      }

      let txToInsert = [...transactions];

      // Filtrer les doublons si l'option forcerDoublons est inactive
      if (!options.forcerDoublons) {
        const check = await verifierDoublons(txToInsert, compteId);
        txToInsert = check.aInserer;
      }

      if (txToInsert.length === 0) {
        return { success: true, nombreInseres: 0, erreur: null };
      }

      // Préparation des objets prêts pour Supabase
      const payload = txToInsert.map(tx => ({
        user_id: user.id,
        compte_id: compteId,
        categorie_id: tx.categorie_id || null,
        description: tx.description,
        montant: tx.montant,
        type: tx.type,
        date: tx.date,
        source: 'import',
        import_hash: tx.import_hash || null
      }));

      // Découpage en lots de 500
      const TAILLE_LOT = 500;
      let totalInsere = 0;

      for (let i = 0; i < payload.length; i += TAILLE_LOT) {
        const lot = payload.slice(i, i + TAILLE_LOT);

        const { error } = await supabase
          .from('transactions')
          .insert(lot);

        if (error) {
          console.error("Erreur lors de l'insertion d'un lot:", error.message);
          return {
            success: false,
            nombreInseres: totalInsere,
            erreur: `Erreur lors de l'insertion en base : ${error.message}`
          };
        }

        totalInsere += lot.length;
      }

      return {
        success: true,
        nombreInseres: totalInsere,
        erreur: null
      };
    } catch (e) {
      console.error("Erreur lors du bulk insert:", e);
      return { success: false, nombreInseres: 0, erreur: e.message || "Une erreur inattendue est survenue." };
    }
  }, [verifierDoublons]);

  return {
    verifierDoublons,
    inserer
  };
}
