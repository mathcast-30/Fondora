import { useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useTauxChange } from './useTauxChange';
import { DEVISES_DISPONIBLES, formaterMontantAvecDevise } from '../utils/devises';

export function useConversionDevise() {
    const { deviseReference } = useCurrency();
    const { taux, loading, error, rafraichir, derniereMaj, convertir: convertirDevise } = useTauxChange();

    const convertir = useCallback((montant, deviseSrc) => {
        return convertirDevise(montant, deviseSrc, deviseReference);
    }, [convertirDevise, deviseReference]);

    const formaterMontant = useCallback((montant, devise) => {
        return formaterMontantAvecDevise(montant, devise);
    }, []);

    const tauxVersDeviseRef = useCallback((devise) => {
        // Taux de conversion de "devise" vers "deviseReference"
        // ex: 1 devise = X deviseReference
        return convertirDevise(1, devise, deviseReference);
    }, [convertirDevise, deviseReference]);

    return {
        convertir,
        formaterMontant,
        devisesDisponibles: DEVISES_DISPONIBLES,
        tauxVersDeviseRef,
        deviseRef: deviseReference,
        taux,
        loading,
        error,
        rafraichir,
        derniereMaj
    };
}
