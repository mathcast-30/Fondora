import { useState, useEffect, useCallback } from 'react';

let cacheTaux = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

export function useTauxChange() {
    const [taux, setTaux] = useState(cacheTaux || { EUR: 1 });
    const [loading, setLoading] = useState(!cacheTaux);
    const [error, setError] = useState(null);
    const [derniereMaj, setDerniereMaj] = useState(cacheTimestamp);

    const chargerTaux = useCallback(async () => {
        const now = Date.now();

        // Utiliser le cache si valide
        if (cacheTaux && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
            setTaux(cacheTaux);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('https://api.frankfurter.app/latest?from=EUR');
            if (!res.ok) throw new Error('Erreur récupération taux (Frankfurter)');
            const data = await res.json();
            
            const nouveauxTaux = { ...data.rates, EUR: 1 };
            
            cacheTaux = nouveauxTaux;
            cacheTimestamp = now;
            
            setTaux(nouveauxTaux);
            setDerniereMaj(now);
        } catch (err) {
            console.error(err);
            if (cacheTaux) {
                setError("Taux indisponibles - dernières valeurs connues utilisées");
                setTaux(cacheTaux);
            } else {
                setError("Impossible de charger les taux de change");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFallback = async (devise) => {
        if (!devise || devise === 'EUR' || taux[devise] !== undefined) return;

        try {
            const coinId = devise.toLowerCase();
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`);
            const data = await res.json();
            
            if (data[coinId]?.eur) {
                const rateFromEur = 1 / data[coinId].eur;
                const newTaux = { ...cacheTaux, [devise]: rateFromEur };
                cacheTaux = newTaux;
                setTaux(newTaux);
            }
        } catch (err) {
            console.error(`Erreur fallback Coingecko pour ${devise}`, err);
        }
    };

    const convertir = useCallback((montant, deviseSrc, deviseDst) => {
        if (!montant || Number.isNaN(Number(montant))) return 0;
        if (!deviseSrc || !deviseDst || deviseSrc === deviseDst) return Number(montant);

        const tauxSrc = taux[deviseSrc];
        const tauxDst = taux[deviseDst];

        // Trigger fallback fetch for missing rates
        if (tauxSrc === undefined) fetchFallback(deviseSrc);
        if (tauxDst === undefined) fetchFallback(deviseDst);

        // If rate is still not available, we return the original amount to avoid breaking the UI
        if (tauxSrc === undefined || tauxDst === undefined) return Number(montant);

        // Conversion via EUR pivot
        const montantEur = Number(montant) / tauxSrc;
        return montantEur * tauxDst;
    }, [taux]);

    useEffect(() => {
        chargerTaux();
    }, [chargerTaux]);

    return { 
        taux, 
        loading, 
        error, 
        rafraichir: chargerTaux, 
        derniereMaj, 
        convertir 
    };
}
