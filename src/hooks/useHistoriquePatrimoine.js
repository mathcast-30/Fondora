import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useHistoriquePatrimoine() {
    const [historique, setHistorique] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('TOUT');

    const fetchHistorique = useCallback(async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const maintenant = new Date();
        let dateDebut = null;

        if (periode === '1M') {
            dateDebut = new Date(maintenant);
            dateDebut.setMonth(dateDebut.getMonth() - 1);
        } else if (periode === '3M') {
            dateDebut = new Date(maintenant);
            dateDebut.setMonth(dateDebut.getMonth() - 3);
        } else if (periode === '6M') {
            dateDebut = new Date(maintenant);
            dateDebut.setMonth(dateDebut.getMonth() - 6);
        } else if (periode === '1A') {
            dateDebut = new Date(maintenant);
            dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        }

        let query = supabase
            .from('snapshot_patrimoine')
            .select('date, total_cash, total_bourse, total_crypto, total_assurance_vie, total_immo_net, total_tangible, total_dettes')
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        if (dateDebut) {
            query = query.gte('date', dateDebut.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erreur historique patrimoine:', error);
            setLoading(false);
            return;
        }

        const formatted = (data || []).map(row => {
            const cash = parseFloat(row.total_cash || 0);
            const bourse = parseFloat(row.total_bourse || 0);
            const crypto = parseFloat(row.total_crypto || 0);
            const av = parseFloat(row.total_assurance_vie || 0);
            const immo = parseFloat(row.total_immo_net || 0);
            const tangible = parseFloat(row.total_tangible || 0);
            const dettes = parseFloat(row.total_dettes || 0);

            return {
                date: row.date,
                Cash: cash,
                Bourse: bourse,
                Crypto: crypto,
                'Assurance-vie': av,
                'Immobilier net': immo,
                'Actifs tangibles': tangible,
                _dettes: dettes,
                _patrimoineNet: cash + bourse + crypto + av + immo + tangible - dettes,
            };
        });

        setHistorique(formatted);
        setLoading(false);
    }, [periode]);

    useEffect(() => {
        fetchHistorique();
    }, [fetchHistorique]);

    return { historique, loading, periode, setPeriode, refetch: fetchHistorique };
}
