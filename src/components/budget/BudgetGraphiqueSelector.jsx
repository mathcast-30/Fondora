import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

const GRAPHIQUES_DISPONIBLES = [
  { id: 'restant_a_vivre', label: 'Restant à vivre' },
  { id: 'what_if', label: 'Simulateur « Et si j’épargnais… »' },
  { id: 'echeances', label: 'Échéances à venir' },
  { id: 'abonnements', label: 'Nettoyeur d’abonnements' },
  { id: 'budget_vs_reel', label: 'Budget vs Réel (barres empilées)' },
  { id: 'evolution_temps', label: 'Évolution dépenses/revenus (courbe)' },
  { id: 'objectif_epargne', label: 'Jauge objectif d\'épargne' },
  { id: 'top5_depenses', label: 'Top 5 des plus grosses dépenses' },
  { id: 'flux_financier', label: 'Flux financier' },
  { id: 'repartition_depenses', label: 'Répartition des dépenses' },
  { id: 'budgets', label: 'Suivi des budgets par catégorie' },
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
    }, []);

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
                className="flex items-center gap-2 text-sm font-medium text-[var(--text)] bg-card border border-[var(--border)] px-3 py-2 rounded-lg hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-h)] transition"
            >
                <Settings size={16} />
                Personnaliser les graphiques
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-[var(--border)] rounded-xl shadow-lg z-10 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text-h)] mb-3">Affichage des graphiques</h4>
                    <div className="space-y-3">
                        {GRAPHIQUES_DISPONIBLES.map(graph => (
                            <label key={graph.id} className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald rounded border-[var(--border)] focus:ring-emerald accent-emerald"
                                    checked={graphiquesVisibles.includes(graph.id)}
                                    onChange={() => toggleGraphique(graph.id)}
                                />
                                <span className="text-sm text-[var(--text)]">{graph.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
