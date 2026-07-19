// src/components/Budget/SankeyChart.jsx
import React from "react";
import { Sankey, Tooltip } from "recharts";
import { useBudget } from "../../contexts/BudgetContext";

const SankeyChart = () => {
    const { selectedCategory, setSelectedCategory } = useBudget();

    // Exemple de données pour le graphique Sankey
    // Remplacez par vos données réelles (ex: depuis Supabase)
    const data = {
        nodes: [
            { name: "Restauration", id: 0 },
            { name: "Logement", id: 1 },
            { name: "Transport", id: 2 },
            { name: "Loisirs", id: 3 },
            { name: "Revenu", id: 4 },
        ],
        links: [
            { source: 4, target: 0, value: 300, label: "Restauration" },
            { source: 4, target: 1, value: 800, label: "Logement" },
            { source: 4, target: 2, value: 200, label: "Transport" },
            { source: 4, target: 3, value: 150, label: "Loisirs" },
        ],
    };

    // Composant personnalisé pour les nœuds
    const CustomNode = ({ node }) => {
        const isSelected = selectedCategory === node.name;
        return (
            <g
                onClick={() => setSelectedCategory(isSelected ? null : node.name)}
                style={{
                    cursor: "pointer",
                    filter: isSelected ? "drop-shadow(0 0 4px gold)" : "none",
                }}
            >
                <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    fill={node.color || "#666"}
                    stroke={isSelected ? "gold" : "none"}
                    strokeWidth={2}
                />
                <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize={12}
                >
                    {node.name}
                </text>
            </g>
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Répartition des Dépenses</h2>
            <Sankey
                data={data}
                node={<CustomNode />}
                nodeWidth={20}
                nodePadding={40}
                width={800}
                height={400}
            >
                <Tooltip />
            </Sankey>
        </div>
    );
};

export default SankeyChart;