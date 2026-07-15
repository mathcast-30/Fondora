import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import categoriesDictionary from '../config/categories_dictionary.json';

export function useCategoryPredictor() {
  /**
   * Récupère les règles intelligentes de catégorisation enregistrées par l'utilisateur courant.
   * Ordonnées par priorité décroissante.
   *
   * @returns {Promise<Array>} Liste des règles ou tableau vide en cas d'erreur ou d'absence de règle.
   */
  const chargerSmartRulesUtilisateur = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('smart_rules')
        .select('id, mot_cle, categorie_id, priorite')
        .eq('user_id', user.id)
        .order('priorite', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des smart rules:", error.message);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error("Erreur inattendue dans chargerSmartRulesUtilisateur:", e);
      return [];
    }
  }, []);

  /**
   * Prédit la catégorie la plus adaptée pour un libellé de transaction donné.
   * Recherche d'abord dans les règles personnalisées de l'utilisateur (smart_rules),
   * puis à défaut dans le dictionnaire de secours statique (categories_dictionary.json).
   *
   * @param {string} libelle - Libellé brut de la transaction.
   * @param {Array} [userSmartRules=[]] - Liste des règles personnalisées de l'utilisateur.
   * @returns {{ source: 'smart_rule'|'dictionnaire'|'aucun', categorie_id: string|null, label: string|null }}
   */
  const predictCategory = useCallback((libelle, userSmartRules = []) => {
    // Cas limite : libellé vide ou non défini
    if (!libelle || typeof libelle !== 'string') {
      return { source: 'aucun', categorie_id: null, label: null };
    }

    // Normalisation du libellé
    const libelleNormalise = libelle
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' '); // Réduction des espaces multiples à un seul espace

    // Sûreté sur l'argument smart rules
    const rules = Array.isArray(userSmartRules) ? userSmartRules : [];

    // Étape 1 : Vérification des règles utilisateur par ordre décroissant de priorité
    for (const rule of rules) {
      if (rule?.mot_cle) {
        const motCleNormalise = String(rule.mot_cle).toUpperCase().trim();
        if (libelleNormalise.includes(motCleNormalise)) {
          return {
            source: 'smart_rule',
            categorie_id: rule.categorie_id,
            label: null
          };
        }
      }
    }

    // Étape 2 : Recherche dans le dictionnaire statique
    // Note : Un mot-clé comme "GYM" matchera dans "GYMNASTIQUE" (sous-chaîne sans word-boundary strict).
    // Ce comportement est un choix accepté pour simplifier et optimiser les performances de cette version.
    for (const [nomCategorie, motsCles] of Object.entries(categoriesDictionary)) {
      for (const motCle of motsCles) {
        if (libelleNormalise.includes(motCle)) {
          return {
            source: 'dictionnaire',
            categorie_id: null,
            label: nomCategorie
          };
        }
      }
    }

    // Étape 3 : Aucune correspondance trouvée
    return { source: 'aucun', categorie_id: null, label: null };
  }, []);

  return {
    predictCategory,
    chargerSmartRulesUtilisateur
  };
}
