import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useImportTemplates() {
  /**
   * Récupère tous les templates d'import sauvegardés par l'utilisateur courant.
   * Ordonnés du plus récent au plus ancien.
   *
   * @returns {Promise<Array>} Liste des templates, ou tableau vide si erreur.
   */
  const chargerTemplates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('import_templates')
        .select('id, nom_template, mapping_config, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des templates d'import:", error.message);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error("Erreur inattendue dans chargerTemplates:", e);
      return [];
    }
  }, []);

  /**
   * Sauvegarde une configuration de mapping sous forme de template d'import pour l'utilisateur.
   *
   * @param {string} nomTemplate - Nom explicite donné au template (ex: "Mon relevé Bourso").
   * @param {Object} mappingConfig - Objet de configuration du mapping { colonnes: {...} }.
   * @returns {Promise<{ success: boolean, error: string|null }>} Résultat de l'insertion.
   */
  const sauvegarderTemplate = useCallback(async (nomTemplate, mappingConfig) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Utilisateur non connecté." };
      }

      if (!nomTemplate?.trim()) {
        return { success: false, error: "Le nom du template est requis." };
      }

      const { error } = await supabase
        .from('import_templates')
        .insert({
          user_id: user.id,
          nom_template: nomTemplate.trim(),
          mapping_config: mappingConfig // Supabase gère l'objet JSONB nativement
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: e.message || "Une erreur est survenue lors de la sauvegarde." };
    }
  }, []);

  /**
   * Supprime un template d'import de la base de données.
   *
   * @param {string} templateId - Identifiant UUID du template à supprimer.
   * @returns {Promise<{ success: boolean, error: string|null }>} Résultat de la suppression.
   */
  const supprimerTemplate = useCallback(async (templateId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Utilisateur non connecté." };
      }

      const { error } = await supabase
        .from('import_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: e.message || "Une erreur est survenue lors de la suppression." };
    }
  }, []);

  return {
    chargerTemplates,
    sauvegarderTemplate,
    supprimerTemplate
  };
}
