import Layout from '../components/Layout'
import ProjectionCard from '../components/ProjectionCard'
import ObjectifEpargneCard from '../components/ObjectifEpargneCard'
import StatCard from '../components/StatCard'
import { useTransactions } from '../hooks/useTransactions'
import { useComptes } from '../hooks/useComptes'
import { useObjectifEpargne } from '../hooks/useObjectifEpargne'
import { calculerProjection } from '../lib/projection'
import SecureValue from '../components/SecureValue'

function Synthese() {
    const aujourdHui = new Date()
    const mois = aujourdHui.getMonth() + 1
    const annee = aujourdHui.getFullYear()

    const { transactions, loading } = useTransactions(mois, annee)
    const { comptes } = useComptes()
    const { objectif, definirObjectif } = useObjectifEpargne(mois, annee)

    const projection = calculerProjection(transactions, mois, annee)
    const patrimoineTotal = comptes.reduce((s, c) => s + Number(c.soldeReel ?? c.solde), 0)

    const formatMontant = (m) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    return (
        <Layout>
            <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Synthèse</h1>
            <p className="text-[var(--text)] mb-6">Vue d'ensemble de tes finances.</p>

            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : (
                <>
                    {/* Stats principales */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatCard
                            label="Patrimoine total"
                            valeur={<SecureValue value={patrimoineTotal} formatter={formatMontant} />}
                            sousTexte={`${comptes.length} compte(s)`}
                        />
                        <StatCard
                            label="Solde du mois"
                            valeur={<SecureValue value={projection.soldeActuel} formatter={formatMontant} />}
                            couleur={projection.soldeActuel >= 0 ? '#10b981' : '#ef4444'}
                        />
                        <StatCard
                            label="Solde projeté en fin de mois"
                            valeur={<SecureValue value={projection.soldeProjete} formatter={formatMontant} />}
                            couleur={projection.soldeProjete >= 0 ? '#10b981' : '#ef4444'}
                        />
                    </div>

                    {/* Projection + objectif épargne */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <ProjectionCard projection={projection} />
                        <ObjectifEpargneCard
                            objectif={objectif}
                            soldeActuel={projection.soldeActuel}
                            onDefinirObjectif={definirObjectif}
                        />
                    </div>

                    {/* Liste rapide des comptes */}
                    <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                        <h3 className="text-[var(--text-h)] font-semibold mb-4">Mes comptes</h3>
                        {comptes.length === 0 ? (
                            <p className="text-[var(--text)] text-sm">Aucun compte créé pour l'instant.</p>
                        ) : (
                            <div className="space-y-2">
                                {comptes.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.couleur }} />
                                            <span className="text-sm text-[var(--text-h)]">{c.nom}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--text-h)]">
                                            <SecureValue 
                                                value={c.soldeReel ?? c.solde} 
                                                formatter={(v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c.devise }).format(v)} 
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </Layout>
    )
}

export default Synthese