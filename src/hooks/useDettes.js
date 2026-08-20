import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useEntiteFiltre } from '../context/EntiteContext';
import { useFoyerActif } from '../context/FoyerContext';
import {
    calculerCRD,
    calculerProgressionRemboursement,
    calculerDateFin,
    calculerCoutTotalCredit,
    calculerMensualiteCourante,
} from '../utils/financeCredit';

export function useDettes() {
    const { entiteFiltre } = useEntiteFiltre();
    const { ownerUserIdActif } = useFoyerActif();
    const [dettes, setDettes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Enrichit chaque dette avec les calculs dynamiques
    const enrichirDette = (dette) => {
        const params = {
            capitalEmprunte: dette.capital_emprunte,
            tauxInteret: dette.taux_interet,
            dureeMois: dette.duree_mois,
            mensualite: dette.mensualite,
            dateDebut: dette.date_debut,
            typeAmortissement: dette.type_amortissement || 'classique',
            dureeDiffereMois: dette.duree_differe_mois || 0,
        };

        const crd = calculerCRD(params);
        const progression = calculerProgressionRemboursement(params);
        const dateFin = calculerDateFin({ dateDebut: dette.date_debut, dureeMois: dette.duree_mois });
        const coutTotal = calculerCoutTotalCredit(params);
        const mensualiteCourante = calculerMensualiteCourante(dette);

        return {
            ...dette,
            crd,
            progression,
            dateFin,
            coutTotal,
            mensualiteCourante,
            estRembourse: crd === 0,
        };
    };

    const fetchDettes = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('dettes')
                .select(`
      *,
      biens_immobiliers!dettes_bien_immobilier_id_fkey (
        id,
        nom,
        adresse
      )
    `);
            if (ownerUserIdActif) query = query.eq('user_id', ownerUserIdActif);
            if (entiteFiltre) query = query.eq('entite_id', entiteFiltre);
            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            setDettes((data || []).map(enrichirDette));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [entiteFiltre, ownerUserIdActif]);

    useEffect(() => {
        fetchDettes();
    }, [fetchDettes]);

    // --- KPIs agrégés ---
    const kpis = {
        // Somme de tous les CRD actuels
        totalDettes: dettes.reduce((sum, d) => sum + (d.crd || 0), 0),

        // Somme des mensualités RÉELLEMENT dues ce mois-ci (0 pendant un différé total)
        totalMensualites: dettes
            .filter((d) => !d.estRembourse)
            .reduce((sum, d) => sum + (d.mensualiteCourante ?? d.mensualite), 0),

        // Répartition par type
        parType: dettes.reduce((acc, d) => {
            acc[d.type] = (acc[d.type] || 0) + (d.crd || 0);
            return acc;
        }, {}),

        nombreActifs: dettes.filter((d) => !d.estRembourse).length,
    };

    // --- CRUD ---
    const creerTransactionMensualite = async (dette, userId) => {
        // Calcul de l'échéance du mois courant (sans déborder sur le mois suivant).
        // On repart de date_debut et on avance mois par mois jusqu'à atteindre le mois
        // en cours. On utilise une copie de la Date pour éviter l'effet de bord de
        // setMonth() (le 31/01 + 1 mois doit donner fin février, pas le 3 mars).
        const aujourdhui = new Date();
        let curseur = new Date(dette.date_debut + 'T00:00:00');
        while (curseur <= aujourdhui) {
            const prochain = new Date(curseur.getFullYear(), curseur.getMonth() + 1, curseur.getDate());
            curseur = prochain;
        }
        // curseur est maintenant la prochaine échéance future ; on conserve le jour
        // d'origine mais borné au nombre de jours du mois visé.
        const jourOriginal = new Date(dette.date_debut + 'T00:00:00').getDate();
        const maxJour = new Date(curseur.getFullYear(), curseur.getMonth() + 1, 0).getDate();
        const jour = Math.min(jourOriginal, maxJour);
        const dateEcheance = new Date(curseur.getFullYear(), curseur.getMonth(), jour);
        const dateStr = dateEcheance.toISOString().split('T')[0];

        // Mensualité réelle due à cette échéance (varie selon la phase : différé, in fine…)
        const mensualiteCourante = calculerMensualiteCourante(dette, dateEcheance);

        // Rien à injecter dans le budget si aucune mensualité n'est due ce mois-là
        // (typiquement : phase de différé total)
        if (!mensualiteCourante || mensualiteCourante <= 0) return;

        // Vérifier qu'aucune mensualité n'a déjà été créée pour ce couple dette/mois
        // (plage mensuelle plutôt que date exacte, pour tolérer les écarts de jour).
        const debutMois = new Date(dateEcheance.getFullYear(), dateEcheance.getMonth(), 1)
            .toISOString().split('T')[0];
        const finMois = new Date(dateEcheance.getFullYear(), dateEcheance.getMonth() + 1, 0)
            .toISOString().split('T')[0];
        const { data: existante } = await supabase
            .from('transactions')
            .select('id')
            .eq('dette_id', dette.id)
            .eq('source', 'dette_auto')
            .gte('date', debutMois)
            .lte('date', finMois)
            .maybeSingle();

        if (existante) return; // déjà créée ce mois

        const CATEGORIE_CREDITS_DETTES = 'c139d313-61e3-48ce-b163-968daf7926c6';

        // Créer la transaction. Convention du projet : montant TOUJOURS positif,
        // le sens (revenu/dépense) est porté par le champ `type`. Un montant négatif
        // ferait inverser les totaux (totalDepenses < 0 → solde faussement augmenté).
        await supabase.from('transactions').insert([{
            user_id: userId,
            compte_id: dette.compte_id,
            categorie_id: CATEGORIE_CREDITS_DETTES,
            description: `Mensualité — ${dette.nom}`,
            montant: Math.abs(mensualiteCourante),
            type: 'depense',
            date: dateStr,
            recurrente: true,
            jour_recurrence: jour,
            dette_id: dette.id,
            source: 'dette_auto',
        }]);

        // NB: comptes.solde est immuable après création. Le solde réel est calculé
        // dynamiquement (solde + revenus − dépenses) dans useComptes.js ; toute
        // écriture ici entraînerait un double-comptage de la mensualité.
    };

    const ajouterDette = async (formData) => {
        const { data: nouvelleDette, error } = await supabase
            .from('dettes')
            .insert([{ ...formData, user_id: ownerUserIdActif }])
            .select()
            .single();
        if (error) throw error;

        if (formData.rembourse_automatiquement && formData.compte_id) {
            await creerTransactionMensualite(nouvelleDette, ownerUserIdActif);
        }

        await fetchDettes();
    };

    const modifierDette = async (id, formData) => {
        const { data: updatedDette, error } = await supabase
            .from('dettes')
            .update(formData)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        if (updatedDette.rembourse_automatiquement && updatedDette.compte_id) {
            await creerTransactionMensualite(updatedDette, ownerUserIdActif);
        }

        await fetchDettes();
    };

    const supprimerDette = async (id) => {
        const { error } = await supabase
            .from('dettes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        await fetchDettes();
    };

    return {
        dettes,
        loading,
        error,
        kpis,
        ajouterDette,
        modifierDette,
        supprimerDette,
        refetch: fetchDettes,
    };
}