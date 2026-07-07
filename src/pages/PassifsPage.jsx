// src/pages/PassifsPage.jsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
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

    // Filtrage local
    const dettesFiltrees = filtreActif === 'Tous'
        ? dettes
        : dettes.filter((d) => d.type === filtreActif);

    const pillStyle = (actif) => ({
        padding: '6px 16px',
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: actif ? '2px solid #111827' : '1px solid #D1D5DB',
        background: actif ? '#111827' : 'white',
        color: actif ? 'white' : '#374151',
        transition: 'all 0.15s',
    });

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

            {/* KPIs */}
            <KPIEndettement kpis={kpis} revenusRecurrents={revenusRecurrents} />

            {/* Filtres par type */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {FILTRES.map((filtre) => (
                    <button
                        key={filtre}
                        onClick={() => setFiltreActif(filtre)}
                        style={pillStyle(filtreActif === filtre)}
                    >
                        {filtre}
                        {filtre !== 'Tous' && (
                            <span style={{ marginLeft: 4, opacity: 0.7 }}>
                                ({dettes.filter((d) => d.type === filtre).length})
                            </span>
                        )}
                    </button>
                ))}
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
