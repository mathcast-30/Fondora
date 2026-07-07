import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    calculerCRD,
    calculerProgressionRemboursement,
    calculerDateFin,
    calculerCoutTotalCredit,
} from '../utils/financeCredit';

export function useDettes() {
    const [dettes, setDettes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Enrichit chaque dette avec les calculs dynamiques
    const enrichirDette = (dette) => {
        const crd = calculerCRD({
            capitalEmprunte: dette.capital_emprunte,
            tauxInteret: dette.taux_interet,
            dureeMois: dette.duree_mois,
            mensualite: dette.mensualite,
            dateDebut: dette.date_debut,
        });
        const progression = calculerProgressionRemboursement({
            capitalEmprunte: dette.capital_emprunte,
            tauxInteret: dette.taux_interet,
            dureeMois: dette.duree_mois,
            mensualite: dette.mensualite,
            dateDebut: dette.date_debut,
        });
        const dateFin = calculerDateFin({
            dateDebut: dette.date_debut,
            dureeMois: dette.duree_mois,
        });
        const coutTotal = calculerCoutTotalCredit({
            mensualite: dette.mensualite,
            dureeMois: dette.duree_mois,
            capitalEmprunte: dette.capital_emprunte,
        });

        return {
            ...dette,
            crd,
            progression,
            dateFin,
            coutTotal,
            estRembourse: crd === 0,
        };
    };

    const fetchDettes = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('dettes')
                .select(`
          *,
          biens_immobiliers (
            id,
            nom,
            adresse
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setDettes((data || []).map(enrichirDette));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDettes();
    }, [fetchDettes]);

    // --- KPIs agrégés ---
    const kpis = {
        // Somme de tous les CRD actuels
        totalDettes: dettes.reduce((sum, d) => sum + (d.crd || 0), 0),

        // Somme de toutes les mensualités actives
        totalMensualites: dettes
            .filter((d) => !d.estRembourse)
            .reduce((sum, d) => sum + d.mensualite, 0),

        // Répartition par type
        parType: dettes.reduce((acc, d) => {
            acc[d.type] = (acc[d.type] || 0) + (d.crd || 0);
            return acc;
        }, {}),

        nombreActifs: dettes.filter((d) => !d.estRembourse).length,
    };

    // --- CRUD ---
    const ajouterDette = async (formData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('dettes')
            .insert([{ ...formData, user_id: user.id }]);
        if (error) throw error;
        await fetchDettes();
    };

    const modifierDette = async (id, formData) => {
        const { error } = await supabase
            .from('dettes')
            .update(formData)
            .eq('id', id);
        if (error) throw error;
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