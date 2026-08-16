import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const EntiteContext = createContext();

export function EntiteProvider({ children }) {
    const [entiteFiltre, setEntiteFiltre] = useState(() => {
        try { return localStorage.getItem('fondora_entite_filtre') || null } catch { return null }
    });

    useEffect(() => {
        if (entiteFiltre) localStorage.setItem('fondora_entite_filtre', entiteFiltre);
        else localStorage.removeItem('fondora_entite_filtre');
    }, [entiteFiltre]);

    const value = useMemo(() => ({ entiteFiltre, setEntiteFiltre }), [entiteFiltre]);
    return <EntiteContext.Provider value={value}>{children}</EntiteContext.Provider>;
}

export function useEntiteFiltre() {
    const ctx = useContext(EntiteContext);
    if (!ctx) throw new Error('useEntiteFiltre must be used within EntiteProvider');
    return ctx;
}