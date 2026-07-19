// src/contexts/BudgetContext.jsx
import React, { createContext, useState, useContext } from "react";

const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    return (
        <BudgetContext.Provider value={{ selectedCategory, setSelectedCategory }}>
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudget = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error("useBudget doit être utilisé dans un BudgetProvider");
    }
    return context;
};