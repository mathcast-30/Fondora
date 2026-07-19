import { useState } from 'react'
import Layout from '../components/Layout'
import BarChartComparatif from '../components/BarChartComparatif'
import LineChartSolde from '../components/LineChartSolde'
import StatCard from '../components/StatCard'
import SecureValue from '../components/SecureValue'
import AnalyseFraisTab from '../components/investir/AnalyseFraisTab'
import { AnalyseurFiscal } from '../components/analyse/AnalyseurFiscal'
import { useTransactionsPeriode } from '../hooks/useTransactionsPeriode'
import { regrouperParMois } from '../lib/dateUtils'
import { PiggyBank, TrendingDown } from 'lucide-react'

const PERIODES = [
    { label: '6 mois', valeur: 6 },
    { label: '12 mois', valeur: 12 },
]

function Analyse() {
    const [ongletActif, setOngletActif] = useState('epargne')
    const [nombreMois, setNombreMois] = useState(6)
    const { transactions, loading } = useTransactionsPeriode(nombreMois)

    const data = regrouperParMois(transactions, nombreMois)

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    // Calculs comparatifs
    const moisActuel = data[data.length - 1]
    const meilleurMois = data.reduce((meilleur, m) => (m.solde > (meilleur?.solde ?? -Infinity) ? m : meilleur), null)
    const moyenneSolde = data.length > 0 ? data.reduce((s, m) => s + m.solde, 0) / data.length : 0
    const moyenneTauxEpargne = data.length > 0 ? data.reduce((s, m) => s + m.tauxEpargne, 0) / data.length : 0

    const ecartParRapportMoyenne = moisActuel ? moisActuel.solde - moyenneSolde : 0

    return (
        <Layout>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Analyse</h1>
                    <p className="text-[var(--text)]">Statistiques de ton patrimoine et optimisation.</p>
                </div>
            </div>

            {/* Barre de navigation secondaire */}
            <div className="flex gap-2 mb-6 bg-surface p-1 rounded-lg border border-[var(--border)] w-fit overflow-x-auto max-w-full">
                <button
                    onClick={() => setOngletActif('epargne')}
                    className={`px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition flex items-center gap-2 ${ongletActif === 'epargne' ? 'bg-card text-[var(--text-h)] border border-[var(--border)]' : 'text-[var(--text)] hover:text-[var(--text-h)]'}`}
                >
                    <PiggyBank size={18} /> Analyse de l'Épargne
                </button>
                <button
                    onClick={() => setOngletActif('frais')}
                    className={`px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition flex items-center gap-2 ${ongletActif === 'frais' ? 'bg-card text-[var(--text-h)] border border-[var(--border)]' : 'text-[var(--text)] hover:text-[var(--text-h)]'}`}
                >
                    <TrendingDown size={18} /> Optimisation des Frais
                </button>
                <button
                    onClick={() => setOngletActif('fiscal')}
                    className={`px-4 py-2 whitespace-nowrap rounded-md text-sm font-medium transition flex items-center gap-2 ${ongletActif === 'fiscal' ? 'bg-card text-[var(--text-h)] border border-[var(--border)]' : 'text-[var(--text)] hover:text-[var(--text-h)]'}`}
                >
                    🧾 Analyse Fiscale
                </button>
            </div>

            {ongletActif === 'epargne' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <div className="flex gap-2 bg-surface p-1 rounded-lg border border-[var(--border)]">
                            {PERIODES.map((p) => (
                                <button
                                    key={p.valeur}
                                    onClick={() => setNombreMois(p.valeur)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${nombreMois === p.valeur ? 'bg-emerald text-white' : 'text-[var(--text)]'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-[var(--text)]">Chargement...</p>
                    ) : (
                        <>
                            {/* Stats comparatives */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatCard
                                    label="Mois actuel"
                                    valeur={<SecureValue value={moisActuel?.solde || 0} formatter={formatMontant} />}
                                    sousTexte="Solde de ce mois"
                                    couleur={moisActuel?.solde >= 0 ? '#10b981' : '#ef4444'}
                                />
                                <StatCard
                                    label="Meilleur mois"
                                    valeur={meilleurMois?.label || '-'}
                                    sousTexte={<SecureValue value={meilleurMois?.solde || 0} formatter={formatMontant} />}
                                />
                                <StatCard
                                    label="Moyenne du solde"
                                    valeur={<SecureValue value={moyenneSolde} formatter={formatMontant} />}
                                    sousTexte={`sur ${nombreMois} mois`}
                                />
                                <StatCard
                                    label="Taux d'épargne moyen"
                                    valeur={<SecureValue value={moyenneTauxEpargne} formatter={v => `${v.toFixed(1)} %`} />}
                                    sousTexte={
                                        moisActuel
                                            ? <span>Ce mois-ci : <SecureValue value={moisActuel.tauxEpargne} formatter={v => `${v.toFixed(1)} %`} /></span>
                                            : ''
                                    }
                                    couleur="#10b981"
                                />
                            </div>

                            {/* Comparaison à la moyenne */}
                            <div className={`rounded-xl p-4 border ${ecartParRapportMoyenne >= 0 ? 'bg-emerald/10 border-emerald/20' : 'bg-[var(--negative)]/10 border-[var(--negative)]/20'}`}>
                                <p className={`text-sm font-medium ${ecartParRapportMoyenne >= 0 ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                    {ecartParRapportMoyenne >= 0
                                        ? <span>📈 Ce mois-ci tu es <SecureValue value={Math.abs(ecartParRapportMoyenne)} formatter={formatMontant} /> au-dessus de ta moyenne habituelle, continue comme ça !</span>
                                        : <span>📉 Ce mois-ci tu es <SecureValue value={Math.abs(ecartParRapportMoyenne)} formatter={formatMontant} /> en-dessous de ta moyenne habituelle.</span>}
                                </p>
                            </div>

                            {/* Graphique à barres comparatif */}
                            <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                                <h3 className="text-[var(--text-h)] font-semibold mb-2">Revenus vs Dépenses par mois</h3>
                                <BarChartComparatif data={data} />
                            </div>

                            {/* Courbe d'évolution du solde */}
                            <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                                <h3 className="text-[var(--text-h)] font-semibold mb-2">Évolution du solde mensuel</h3>
                                <LineChartSolde data={data} />
                            </div>
                        </>
                    )}
                </div>
            )}

            {ongletActif === 'frais' && (
                <AnalyseFraisTab />
            )}

            {ongletActif === 'fiscal' && (
                <div className="bg-card rounded-xl border border-[var(--border)] overflow-hidden pb-4">
                    <AnalyseurFiscal />
                </div>
            )}
        </Layout>
    )
}

export default Analyse