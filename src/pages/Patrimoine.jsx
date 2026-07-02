import { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import CompteCard from '../components/CompteCard'
import ComparaisonINSEE from '../components/ComparaisonINSEE'
import { useComptes } from '../hooks/useComptes'
import { usePositions } from '../hooks/usePositions'
import { useCoursBourse } from '../hooks/useCoursBourse'
import { usePositionsCrypto } from '../hooks/usePositionsCrypto'
import { useCoursCrypto } from '../hooks/useCoursCrypto'
import { useBiensImmobiliers } from '../hooks/useBiensImmobiliers'
import { Plus } from 'lucide-react'

const TYPES_COMPTES = ['Compte courant', 'Épargne', 'Crédit', 'PEA', 'Assurance vie', 'Crypto', 'Immobilier', 'Autre']
const COULEURS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function Patrimoine() {
    const { comptes, loading, ajouterCompte, supprimerCompte } = useComptes()
    const [modalOuvert, setModalOuvert] = useState(false)
    const [form, setForm] = useState({ nom: '', type: 'Compte courant', solde: '', devise: 'EUR', couleur: COULEURS[0] })

    // Valorisation investissements
    const { positions } = usePositions()
    const { cours } = useCoursBourse(positions.map((p) => p.symbole))
    const { positions: positionsCrypto } = usePositionsCrypto()
    const { cours: coursCrypto } = useCoursCrypto(positionsCrypto.map((p) => p.coin_id))
    const { valeurTotaleImmo } = useBiensImmobiliers()

    const totalComptes = comptes.reduce((acc, c) => acc + Number(c.solde), 0)
    const totalActions = positions.reduce((acc, p) => acc + (cours[p.symbole]?.coursActuel || p.prix_achat_moyen) * p.quantite, 0)
    const totalCrypto = positionsCrypto.reduce((acc, p) => acc + (coursCrypto[p.coin_id]?.eur || p.prix_achat_moyen) * p.quantite, 0)
    const patrimoineTotal = totalComptes + totalActions + totalCrypto + valeurTotaleImmo

    const formatMontant = (m, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(m)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await ajouterCompte({ ...form, solde: parseFloat(form.solde) || 0 })
        if (!error) {
            setForm({ nom: '', type: 'Compte courant', solde: '', devise: 'EUR', couleur: COULEURS[0] })
            setModalOuvert(false)
        }
    }

    const handleSupprimer = async (id) => {
        if (confirm('Supprimer ce compte ?')) await supprimerCompte(id)
    }

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-navy text-3xl font-bold mb-1">Patrimoine</h1>
                    <p className="text-gray-500">Vue consolidée de tous tes actifs.</p>
                </div>
                <button onClick={() => setModalOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                    <Plus size={18} /> Ajouter un compte
                </button>
            </div>

            {/* Patrimoine total consolidé */}
            <div className="bg-navy rounded-2xl p-6 mb-6">
                <p className="text-gray-300 text-sm mb-1">Patrimoine total consolidé</p>
                <p className="text-white text-3xl font-bold mb-4">{formatMontant(patrimoineTotal)}</p>
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Comptes bancaires</p>
                        <p className="text-white font-semibold">{formatMontant(totalComptes)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Actions & ETF</p>
                        <p className="text-emerald font-semibold">{formatMontant(totalActions)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Crypto</p>
                        <p className="text-emerald font-semibold">{formatMontant(totalCrypto)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs mb-1">Immobilier</p>
                        <p className="text-emerald font-semibold">{formatMontant(valeurTotaleImmo)}</p>
                    </div>
                </div>
            </div>

            {/* Comparaison INSEE */}
            <div className="mb-6">
                <ComparaisonINSEE patrimoineTotal={patrimoineTotal} />
            </div>

            {/* Liste des comptes */}
            {loading ? (
                <p className="text-gray-400">Chargement...</p>
            ) : comptes.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                    Aucun compte pour l'instant. Clique sur "Ajouter un compte" pour commencer.
                </div>
            ) : (
                <div className="space-y-3">
                    {comptes.map((compte) => (
                        <CompteCard key={compte.id} compte={compte} onSupprimer={handleSupprimer} />
                    ))}
                </div>
            )}

            {/* Modal ajout compte */}
            <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouveau compte">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">Nom du compte</label>
                        <input type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex: Compte Boursorama" className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">Type de compte</label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                            {TYPES_COMPTES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Solde actuel</label>
                            <input type="number" step="0.01" required value={form.solde}
                                onChange={(e) => setForm({ ...form, solde: e.target.value })} placeholder="0.00" className="w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div className="w-28">
                            <label className="text-sm text-gray-600 mb-1 block">Devise</label>
                            <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">Couleur</label>
                        <div className="flex gap-2">
                            {COULEURS.map((couleur) => (
                                <button key={couleur} type="button" onClick={() => setForm({ ...form, couleur })}
                                    className={`w-8 h-8 rounded-full border-2 ${form.couleur === couleur ? 'border-navy' : 'border-transparent'}`}
                                    style={{ backgroundColor: couleur }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Créer le compte
                    </button>
                </form>
            </Modal>
        </Layout>
    )
}

export default Patrimoine