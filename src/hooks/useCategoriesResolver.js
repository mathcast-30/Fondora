import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Normalise une chaîne de caractères pour comparaison (minuscules et sans accents/diacritiques).
 */
function normaliserTexte(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function useCategoriesResolver() {
  const [categoriesCache, setCategoriesCache] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger toutes les catégories disponibles pour l'utilisateur au montage (user_id = auth.uid() OR user_id IS NULL)
  const chargerCategoriesCache = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('categories')
        .select('id, nom, user_id, type');
        
      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Erreur lors du chargement des catégories pour le résolveur:", error.message);
      } else {
        setCategoriesCache(data || []);
      }
    } catch (e) {
      console.error("Erreur inattendue dans chargerCategoriesCache:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerCategoriesCache();
  }, [chargerCategoriesCache]);

  /**
   * Résout un libellé textuel de catégorie vers son ID unique en base de données.
   * Si la catégorie n'existe pas (ni en global ni en personnalisé), elle est créée.
   * Utilise une comparaison insensible à la casse et aux accents.
   *
   * @param {string|null} label - Nom de la catégorie à résoudre.
   * @param {string} [typeDefaut='depense'] - Type de catégorie par défaut ('depense'|'recette').
   * @returns {Promise<string|null>} L'ID UUID de la catégorie résolue, ou null.
   */
  const resolveCategorieId = useCallback(async (label, typeDefaut = 'depense') => {
    if (!label) return null;

    const labelNormalise = normaliserTexte(label);

    // 1. Recherche dans le cache local (qui contient les catégories de la base + les nouvelles créées)
    const match = categoriesCache.find(
      c => normaliserTexte(c.nom) === labelNormalise && c.type === typeDefaut
    );

    if (match) {
      return match.id;
    }

    // 2. Si non trouvée dans le cache, on la crée
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          nom: label.trim(),
          type: typeDefaut
        })
        .select('id, nom, user_id, type')
        .single();

      if (error) {
        // En cas d'erreur (ex: conflit d'insertion concurrente), on tente un fallback de sécurité
        // en réinterrogeant la base de données
        console.warn("Échec de la création automatique, tentative de récupération de l'existant :", error.message);
        
        const { data: fallbackData } = await supabase
          .from('categories')
          .select('id, nom, user_id, type')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .eq('type', typeDefaut);

        const dbMatch = fallbackData?.find(c => normaliserTexte(c.nom) === labelNormalise);
        if (dbMatch) {
          // On ajoute la catégorie récupérée au cache
          setCategoriesCache(prev => [...prev, dbMatch]);
          return dbMatch.id;
        }
        return null;
      }

      if (data) {
        // Mise à jour immédiate du cache local pour éviter les insertions multiples
        // lors d'appels successifs dans la même boucle
        setCategoriesCache(prev => [...prev, data]);
        return data.id;
      }
    } catch (e) {
      console.error("Erreur inattendue lors de la résolution de la catégorie:", e);
    }

    return null;
  }, [categoriesCache]);

  return {
    resolveCategorieId,
    categoriesCache,
    loading,
    rafraichirCategories: chargerCategoriesCache
  };
}
