import React, { createContext, useState, useEffect } from "react";
import { useSupabase } from "../supabase/SupabaseProvider";

export const ParametresContext = createContext();

export const ParametresProvider = ({ children }) => {
    const { supabase, user } = useSupabase();
    const [parametres, setParametres] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Récupérer les paramètres de l'utilisateur
    useEffect(() => {
        const fetchParametres = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("parametres_simulateur")
                .select("*")
                .eq("user_id", user.id)
                .single();
            setParametres(data);
            setIsLoading(false);
        };
        fetchParametres();
    }, [user]);

    // Mettre à jour les paramètres
    const updateParametres = async (newParams) => {
        const { data, error } = await supabase
            .from("parametres_simulateur")
            .upsert({ ...newParams, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        setParametres(data);
        return data;
    };

    return (
        <ParametresContext.Provider value={{ parametres, setParametres: updateParametres, isLoading }}>
            {children}
        </ParametresContext.Provider>
    );
};