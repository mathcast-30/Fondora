import Layout from '../components/Layout'
import SecureValue from '../components/SecureValue'
import { useComptes } from '../hooks/useComptes'
import { Wallet, TrendingUp, CreditCard, Home } from 'lucide-react'

const CATEGORIES = [
    {
        id: 'liquidites',
        titre: 'Comptes courants & épargne',
        description: "Ton argent disponible au quotidien : dépenses courantes, virements, et l'épargne de précaution (Livret A, LDDS...). C'est ce qui alimente ton \"Restant à vivre\" dans le Budget.",
        icone: Wallet,
        couleur: '#10b981',
        types: ['Compte courant', 'Épargne'],
    },
    {
        id: 'investissement',
        titre: "Comptes d'investissement",
        description: "PEA, CTO, Assurance-Vie et Crypto : ton argent placé pour faire fructifier ton capital sur le long terme. Le détail des positions se gère dans l'onglet Investir.",
        icone: TrendingUp,
        couleur: '#6366f1',
        types: ['PEA', 'CTO', 'Assurance vie', 'Crypto'],
    },
    {
        id: 'immobilier',
        titre: 'Immobilier',
        description: "Comptes rattachés à un bien immobilier. Le suivi détaillé (loyers, charges, crédit) se fait dans l'onglet Investir > Immobilier.",
        icone: Home,
        couleur: '#f59e0b',
        types: ['Immobilier'],
    },
    {
        id: 'credit',
        titre: 'Crédits & Autres',
        description: "Comptes de crédit et tout ce qui ne rentre pas dans les autres catégories. Le suivi détaillé des dettes (CRD, tableau d'amortissement) se fait dans l'onglet Passifs & Dettes.",
        icone: CreditCard,
        couleur: '#ef4444',
        types: ['Crédit', 'Autre'],
    },
]

function Comptes() {
    const { comptes, loading } = useComptes()

    const formatMontant = (montant, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(montant)

    return (
        <Layout>
            <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Comptes</h1>
            <p className="text-[var(--text)] mb-6">Tes comptes classés par usage.</p>

            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : comptes.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-[var(--text)] border border-[var(--border)]">
                    Aucun compte pour l'instant. Ajoute-en un depuis l'onglet Patrimoine.
                </div>
            ) : (
                <div className="space-y-6">
                    {CATEGORIES.map((cat) => {
                        const comptesCategorie = comptes.filter((c) => cat.types.includes(c.type))
                        if (comptesCategorie.length === 0) return null

                        const totalCategorie = comptesCategorie.reduce(
                            (s, c) => s + Number(c.soldeReel ?? c.solde), 0
                        )
                        const Icone = cat.icone

                        return (
                            <div key={cat.id} className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden">
                                <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${cat.couleur}20` }}
                                        >
                                            <Icone size={18} style={{ color: cat.couleur }} />
                                        </div>
                                        <div>
                                            <h2 className="text-[var(--text-h)] font-bold text-lg">{cat.titre}</h2>
                                            <p className="text-[var(--text)] text-sm mt-1 max-w-xl">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[var(--text)] text-xs mb-1">Total</p>
                                        <p className="text-[var(--text-h)] font-bold text-xl">
                                            <SecureValue value={totalCategorie} formatter={(v) => formatMontant(v)} />
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-[var(--border)]">
                                    {comptesCategorie.map((compte) => (
                                        <div key={compte.id} className="flex items-center justify-between px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: compte.couleur }} />
                                                <div>
                                                    <p className="font-medium text-[var(--text-h)]">{compte.nom}</p>
                                                    <p className="text-xs text-[var(--text)]">{compte.type}</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-[var(--text-h)]">
                                                <SecureValue value={compte.soldeReel ?? compte.solde} formatter={(v) => formatMontant(v, compte.devise)} />
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </Layout>
    )
}

export default Comptes