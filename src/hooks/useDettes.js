import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
      biens_immobiliers!dettes_bien_immobilier_id_fkey (
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
    const creerTransactionMensualite = async (dette, userId) => {
        const aujourdhui = new Date();
        let dateEcheance = new Date(dette.date_debut);
        
        // Calculer la prochaine échéance à venir
        while (dateEcheance < aujourdhui) {
            const nextMonth = dateEcheance.getMonth() + 1;
            dateEcheance = new Date(dateEcheance.setMonth(nextMonth));
        }
        const dateStr = dateEcheance.toISOString().split('T')[0];

        // Vérifier si une transaction existe déjà pour cette échéance
        const { data: existante } = await supabase
            .from('transactions')
            .select('id')
            .eq('dette_id', dette.id)
            .eq('date', dateStr)
            .maybeSingle();
        
        if (existante) return; // déjà créée

        const CATEGORIE_CREDITS_DETTES = 'c139d313-61e3-48ce-b163-968daf7926c6';

        // Créer la transaction
        await supabase.from('transactions').insert([{
            user_id: userId,
            compte_id: dette.compte_id,
            categorie_id: CATEGORIE_CREDITS_DETTES,
            description: `Mensualité — ${dette.nom}`,
            montant: -Math.abs(dette.mensualite),
            type: 'depense',
            date: dateStr,
            recurrente: true,
            jour_recurrence: dateEcheance.getDate(),
            dette_id: dette.id,
            source: 'dette_auto',
        }]);

        // Déduire le solde du compte
        const { data: compte } = await supabase
            .from('comptes')
            .select('solde')
            .eq('id', dette.compte_id)
            .single();
        
        if (compte) {
            await supabase
                .from('comptes')
                .update({ solde: Number(compte.solde) - Math.abs(dette.mensualite) })
                .eq('id', dette.compte_id);
        }
    };

    const ajouterDette = async (formData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: nouvelleDette, error } = await supabase
            .from('dettes')
            .insert([{ ...formData, user_id: user.id }])
            .select()
            .single();
        if (error) throw error;

        if (formData.rembourse_automatiquement && formData.compte_id) {
            await creerTransactionMensualite(nouvelleDette, user.id);
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
            const { data: { user } } = await supabase.auth.getUser();
            await creerTransactionMensualite(updatedDette, user.id);
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