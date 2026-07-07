import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getSymboleDevise } from '../utils/devises';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const { user, profile } = useAuth();
    const [deviseReference, setDeviseReferenceState] = useState('EUR');

    useEffect(() => {
        if (profile?.devise_reference) {
            setDeviseReferenceState(profile.devise_reference);
        } else if (!user) {
            setDeviseReferenceState('EUR');
        }
    }, [profile, user]);

    const setDeviseReference = async (nouvelleDevise) => {
        if (!user) return;
        
        const ancienneDevise = deviseReference;
        // Optimistic update
        setDeviseReferenceState(nouvelleDevise);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ devise_reference: nouvelleDevise })
                .eq('id', user.id);

            if (error) throw error;
        } catch (err) {
            console.error('Erreur mise à jour devise:', err);
            // Rollback en cas d'erreur
            setDeviseReferenceState(ancienneDevise);
        }
    };

    const symboleDevise = getSymboleDevise(deviseReference);

    return (
        <CurrencyContext.Provider value={{ deviseReference, setDeviseReference, symboleDevise }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}
