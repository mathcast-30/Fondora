import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

const GRAPHIQUES_DISPONIBLES = [
  { id: 'budget_vs_reel', label: 'Budget vs Réel (barres empilées)' },
  { id: 'evolution_temps', label: 'Évolution dépenses/revenus (courbe)' },
  { id: 'objectif_epargne', label: 'Jauge objectif d\'épargne' },
  { id: 'top5_depenses', label: 'Top 5 des plus grosses dépenses' },
];

export default function BudgetGraphiqueSelector({ graphiquesVisibles, setGraphiquesVisibles }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const toggleGraphique = (id) => {
        let nouveauxVisibles;
        if (graphiquesVisibles.includes(id)) {
            nouveauxVisibles = graphiquesVisibles.filter(g => g !== id);
        } else {
            nouveauxVisibles = [...graphiquesVisibles, id];
        }
        setGraphiquesVisibles(nouveauxVisibles);
        localStorage.setItem('fondora_budget_graphiques', JSON.stringify(nouveauxVisibles));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
                <Settings size={16} />
                Personnaliser les graphiques
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
                    <h4 className="text-sm font-semibold text-navy mb-3">Affichage des graphiques</h4>
                    <div className="space-y-3">
                        {GRAPHIQUES_DISPONIBLES.map(graph => (
                            <label key={graph.id} className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald rounded border-gray-300 focus:ring-emerald accent-emerald"
                                    checked={graphiquesVisibles.includes(graph.id)}
                                    onChange={() => toggleGraphique(graph.id)}
                                />
                                <span className="text-sm text-slate-700">{graph.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
