// src/components/Budget/TransactionTable.jsx
import React, { useEffect, useState } from "react";
import { useBudget } from "../../contexts/BudgetContext";
import { supabase } from "../../supabaseClient";

const TransactionTable = () => {
    const { selectedCategory } = useBudget();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Charger les transactions depuis Supabase
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .order("date", { ascending: false });

                if (error) throw error;
                setTransactions(data || []);
            } catch (error) {
                console.error("Erreur lors du chargement des transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Filtrer les transactions en fonction de la catégorie sélectionnée
    const filteredTransactions = selectedCategory
        ? transactions.filter((t) => t.categorie === selectedCategory)
        : transactions;

    if (loading) {
        return <div>Chargement des transactions...</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
                {selectedCategory ? `Transactions - ${selectedCategory}` : "Toutes les Transactions"}
            </h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Montant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Catégorie
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString("fr-FR")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.montant.toFixed(2)} €
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.categorie}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {transaction.description}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                    Aucune transaction trouvée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionTable;