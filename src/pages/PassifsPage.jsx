// src/pages/PassifsPage.jsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDettes } from '../hooks/useDettes';
import { KPIEndettement } from '../components/passifs/KPIEndettement';
import { DetteCard } from '../components/passifs/DetteCard';
import { FormDette } from '../components/passifs/FormDette';
import { TableauAmortissement } from '../components/passifs/TableauAmortissement';

const FILTRES = ['Tous', 'Immobilier', 'Consommation', 'Automobile', 'Dette Privée', 'Fiscale', 'Autre'];

function EmptyState() {
    return (
        <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'white',
            borderRadius: 16,
            border: '1px dashed #D1D5DB',
        }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
                <circle cx="40" cy="40" r="40" fill="#F3F4F6" />
                <path d="M25 35C25 30.029 29.029 26 34 26H46C50.971 26 55 30.029 55 35V47C55 51.971 50.971 56 46 56H34C29.029 56 25 51.971 25 47V35Z" fill="#E5E7EB" />
                <path d="M33 38H47M33 44H43" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                <circle cx="56" cy="24" r="8" fill="#10B981" />
                <path d="M53 24L55.5 26.5L59 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#374151' }}>
                Aucune dette enregistrée
            </h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Commencez par ajouter votre premier crédit.
            </p>
        </div>
    );
}

function PassifsPage() {
    const { dettes, loading, error, kpis, ajouterDette, modifierDette, supprimerDette } = useDettes();

    const [modalOuvert, setModalOuvert] = useState(false);
    const [detteSelectionnee, setDetteSelectionnee] = useState(null);
    const [detteAmortissement, setDetteAmortissement] = useState(null);
    const [filtreActif, setFiltreActif] = useState('Tous');
    const [triActif, setTriActif] = useState('crd_desc');
    const [revenusRecurrents, setRevenusRecurrents] = useState(0);
    const [biensImmobiliers, setBiensImmobiliers] = useState([]);

    // Calcul des revenus récurrents du mois en cours
    useEffect(() => {
        const fetchRevenus = async () => {
            const maintenant = new Date();
            const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString().split('T')[0];
            const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0).toISOString().split('T')[0];

            try {
                const { data } = await supabase
                    .from('transactions')
                    .select('montant')
                    .gte('date', debutMois)
                    .lte('date', finMois)
                    .gt('montant', 0);

                const total = (data || []).reduce((sum, t) => sum + t.montant, 0);
                setRevenusRecurrents(total);
            } catch (_) {
                setRevenusRecurrents(0);
            }
        };
        fetchRevenus();
    }, []);

    // Fetch biens immobiliers pour le formulaire
    const fetchBiensImmobiliers = async () => {
        try {
            const { data } = await supabase
                .from('biens_immobiliers')
                .select('id, nom')
                .order('nom');
            setBiensImmobiliers(data || []);
        } catch (_) {
            setBiensImmobiliers([]);
        }
    };

    const ouvrirModal = async (dette = null) => {
        setDetteSelectionnee(dette);
        await fetchBiensImmobiliers();
        setModalOuvert(true);
    };

    const fermerModal = () => {
        setModalOuvert(false);
        setDetteSelectionnee(null);
    };

    const handleSubmit = async (formData) => {
        if (detteSelectionnee) {
            await modifierDette(detteSelectionnee.id, formData);
        } else {
            await ajouterDette(formData);
        }
    };

    const handleDelete = async (id) => {
        await supprimerDette(id);
    };

    // Filtrage et Tri local
    let dettesFiltrees = filtreActif === 'Tous'
        ? [...dettes]
        : dettes.filter((d) => d.type === filtreActif);

    dettesFiltrees.sort((a, b) => {
        if (triActif === 'crd_desc') return (b.crdActuel || 0) - (a.crdActuel || 0);
        if (triActif === 'crd_asc') return (a.crdActuel || 0) - (b.crdActuel || 0);
        if (triActif === 'date_fin') return new Date(a.dateFin || '2100-01-01') - new Date(b.dateFin || '2100-01-01');
        if (triActif === 'type') return a.type.localeCompare(b.type);
        return 0;
    });

    const exporterCSV = () => {
        const data = dettes.map(d => ({
            Nom: d.nom,
            Type: d.type,
            "Capital Emprunté": d.capital_emprunte,
            "CRD Actuel": Math.round((d.crdActuel || 0) * 100) / 100,
            "Taux (%)": d.taux_interet,
            "Mensualité": d.mensualite,
            "Date de début": d.date_debut,
            "Date de fin estimée": d.dateFin
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dettes");
        XLSX.writeFile(workbook, "Fondora_Dettes.csv");
    };


    return (
        <Layout>
            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: '#111827' }}>
                        ⛔ Passifs & Dettes
                    </h1>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                        Suivi de vos crédits, emprunts et obligations financières.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={exporterCSV}
                        style={{
                            background: 'white',
                            color: '#111827',
                            border: '1px solid #D1D5DB',
                            borderRadius: 10,
                            padding: '10px 16px',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <Download size={18} /> CSV
                    </button>
                    <button
                        onClick={() => ouvrirModal()}
                        style={{
                            background: '#111827',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            padding: '10px 20px',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        ➕ Ajouter un crédit
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <KPIEndettement kpis={kpis} revenusRecurrents={revenusRecurrents} />

            {/* Filtres par type (Sous-onglets) et Tri */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

                {/* CONTENEUR DES SOUS-ONGLETS - Style forcé aux couleurs Fondora */}
                <div
                    style={{
                        backgroundColor: '#111a2c',
                        borderColor: 'rgba(148, 163, 184, 0.12)',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                    }}
                    className="inline-flex items-center p-1.5 rounded-xl gap-1 mb-6 flex-wrap"
                >
                    {FILTRES.map((filtre) => {
                        const countNb = filtre !== 'Tous' ? dettes.filter((d) => d.type === filtre).length : dettes.length;
                        const isSelected = filtreActif === filtre;

                        return (
                            <button
                                key={filtre}
                                type="button"
                                onClick={() => setFiltreActif(filtre)}
                                style={isSelected ? {
                                    backgroundColor: '#1a2537',
                                    color: '#f8fafc',
                                    borderColor: 'rgba(148, 163, 184, 0.2)',
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                } : {
                                    backgroundColor: 'transparent',
                                    color: '#64748b'
                                }}
                                className={`px-4 py-2 text-sm ${isSelected ? 'font-semibold rounded-lg shadow-sm' : 'font-medium rounded-lg hover:text-[#94a3b8]'} transition-all cursor-pointer flex items-center gap-1.5`}
                            >
                                <span>{filtre}</span>
                                <span
                                    style={{
                                        backgroundColor: isSelected ? '#111a2c' : '#1a2537',
                                        color: isSelected ? '#f8fafc' : '#94a3b8'
                                    }}
                                    className="text-xs px-1.5 py-0.5 rounded-full"
                                >
                                    {countNb}
                                </span>
                            </button>
                        );
                    })}
                </div>




                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748b] font-medium font-inter">Trier par :</span>
                    <select
                        value={triActif}
                        onChange={(e) => setTriActif(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.15)] text-xs text-[#f8fafc] bg-[#1a2537] cursor-pointer font-inter focus:outline-none focus:border-indigo-500"
                    >
                        <option value="crd_desc">Montant CRD (Décroissant)</option>
                        <option value="crd_asc">Montant CRD (Croissant)</option>
                        <option value="date_fin">Date de fin</option>
                        <option value="type">Type de dette</option>
                    </select>
                </div>
            </div>


            {/* Contenu principal */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
                    Chargement de vos dettes...
                </div>
            ) : error ? (
                <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 10, padding: 16, color: '#EF4444', fontSize: 14,
                }}>
                    Erreur : {error}
                </div>
            ) : dettesFiltrees.length === 0 ? (
                <EmptyState />
            ) : (
                <div>
                    {dettesFiltrees.map((dette) => (
                        <DetteCard
                            key={dette.id}
                            dette={dette}
                            onEdit={(d) => ouvrirModal(d)}
                            onDelete={handleDelete}
                            onVoirTableau={(d) => setDetteAmortissement(d)}
                        />
                    ))}
                </div>
            )}

            {/* Modal FormDette */}
            <FormDette
                ouvert={modalOuvert}
                onClose={fermerModal}
                onSubmit={handleSubmit}
                detteInitiale={detteSelectionnee}
                biensImmobiliers={biensImmobiliers}
            />

            {/* Modal Tableau d'amortissement */}
            <TableauAmortissement
                dette={detteAmortissement}
                ouvert={!!detteAmortissement}
                onClose={() => setDetteAmortissement(null)}
            />
        </Layout>
    );
}

export default PassifsPage;
