import { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import SecureValue from '../components/SecureValue'
import BadgeTauxLivret from '../components/BadgeTauxLivret'
import ModalHistoriqueInterets from '../components/ModalHistoriqueInterets'
import ModalTauxLivretJeune from '../components/ModalTauxLivretJeune'
import { useComptes } from '../hooks/useComptes'
import { useEntites } from '../hooks/useEntites'
import { useEntiteFiltre } from '../context/EntiteContext'
import { Wallet, TrendingUp, CreditCard, Home, HelpCircle, Plus, Trash2, Pencil, MessageSquare, PiggyBank, Percent } from 'lucide-react'

const TYPES_COMPTES = ['Compte courant', 'Compte chèques', 'Épargne', 'Livret A', 'LDDS', 'LEP', 'Livret Jeune', 'Espèces', 'Crédit', 'PEA', 'CTO', 'Assurance vie', 'Crypto', 'Immobilier', 'Autre']
const COULEURS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const TYPES_LIVRETS = ['livret a', 'ldds', 'lep', 'livret jeune']
const PLAFONDS = { 'livret a': 22950, 'ldds': 12000, 'lep': 10000 }

const CATEGORIES = [
    {
        id: 'liquidites',
        titre: 'Comptes courants & épargne',
        description: "Ton argent disponible au quotidien : dépenses courantes, virements, espèces, et l'épargne de précaution (Livret A, LDDS...). C'est ce qui alimente ton \"Restant à vivre\" dans le Budget.",
        icone: Wallet,
        couleur: '#10b981',
        types: ['compte courant', 'compte chèques', 'compte cheques', 'épargne', 'epargne', 'espèces', 'especes', 'cash', 'livret a', 'ldds', 'lep', 'livret jeune'],
    },
    {
        id: 'investissement',
        titre: "Comptes d'investissement",
        description: "PEA, CTO, Assurance-Vie et Crypto : ton argent placé pour faire fructifier ton capital sur le long terme. Le détail des positions se gère dans l'onglet Investir.",
        icone: TrendingUp,
        couleur: '#6366f1',
        types: ['pea', 'cto', 'assurance vie', 'crypto'],
    },
    {
        id: 'immobilier',
        titre: 'Immobilier',
        description: "Comptes rattachés à un bien immobilier. Le suivi détaillé (loyers, charges, crédit) se fait dans l'onglet Investir > Immobilier.",
        icone: Home,
        couleur: '#f59e0b',
        types: ['immobilier'],
    },
    {
        id: 'credit',
        titre: 'Crédits & Autres',
        description: "Comptes de crédit et tout ce qui ne rentre pas dans les autres catégories. Le suivi détaillé des dettes (CRD, tableau d'amortissement) se fait dans l'onglet Passifs & Dettes.",
        icone: CreditCard,
        couleur: '#ef4444',
        types: ['crédit', 'credit', 'autre'],
    },
]

const normaliser = (str) => (str || '').trim().toLowerCase()

function Comptes() {
    const { comptes, loading, ajouterCompte, modifierCompte, supprimerCompte } = useComptes()
    const { entites } = useEntites()
    const { entiteFiltre } = useEntiteFiltre()
    const [modalOuvert, setModalOuvert] = useState(false)
    const [form, setForm] = useState({
        nom: '', type: 'Compte courant', solde: '', devise: 'EUR', couleur: COULEURS[0],
        frais_gestion_enveloppe: 0.60, frais_courtage_pourcentage: 0.20,
        entite_id: entiteFiltre || ''
    })

    const [compteEnEdition, setCompteEnEdition] = useState(null)
    const [formEdition, setFormEdition] = useState({ nom: '', couleur: COULEURS[0], commentaire: '' })
    const [compteHistoriqueInterets, setCompteHistoriqueInterets] = useState(null)
    const [compteTauxLivretJeune, setCompteTauxLivretJeune] = useState(null)

    const ouvrirEdition = (compte) => {
        setCompteEnEdition(compte)
        setFormEdition({
            nom: compte.nom,
            couleur: compte.couleur || COULEURS[0],
            commentaire: compte.commentaire || ''
        })
    }

    const handleSubmitEdition = async (e) => {
        e.preventDefault()
        const { error } = await modifierCompte(compteEnEdition.id, {
            nom: formEdition.nom,
            couleur: formEdition.couleur,
            commentaire: formEdition.commentaire || null
        })
        if (!error) setCompteEnEdition(null)
    }

    const formatMontant = (montant, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(montant)

    // Répartition des comptes par catégorie, en collectant au passage
    // les IDs déjà classés pour détecter ceux qui n'ont matché aucune catégorie.
    const idsClasses = new Set()
    const groupes = CATEGORIES.map((cat) => {
        const comptesCategorie = comptes.filter((c) => {
            const match = cat.types.includes(normaliser(c.type))
            if (match) idsClasses.add(c.id)
            return match
        })
        return { ...cat, comptes: comptesCategorie }
    })
    const comptesNonClasses = comptes.filter((c) => !idsClasses.has(c.id))
    if (comptesNonClasses.length > 0) {
        groupes.push({
            id: 'autres',
            titre: 'Autres comptes',
            description: "Comptes dont le type ne correspond à aucune catégorie ci-dessus.",
            icone: HelpCircle,
            couleur: '#94a3b8',
            comptes: comptesNonClasses,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const typeNormalise = normaliser(form.type)
        const estLivretJeune = typeNormalise === 'livret jeune'

        const { error, data } = await ajouterCompte({
            nom: form.nom, type: form.type,
            entite_id: form.entite_id || null,
            solde: parseFloat(form.solde) || 0,
            devise: form.devise,
            couleur: form.couleur,
            frais_gestion_enveloppe: parseFloat(form.frais_gestion_enveloppe) || 0,
            frais_courtage_pourcentage: parseFloat(form.frais_courtage_pourcentage) || 0
        })

        if (!error) {
            setForm({ nom: '', type: 'Compte courant', solde: '', devise: 'EUR', couleur: COULEURS[0], frais_gestion_enveloppe: 0.60, frais_courtage_pourcentage: 0.20, entite_id: entiteFiltre || '' })
            setModalOuvert(false)

            // Livret Jeune : le taux est propre à chaque banque, on demande immédiatement à l'utilisateur de le saisir
            if (estLivretJeune && data) {
                setCompteTauxLivretJeune(data)
            }
        }
    }

    const handleSupprimer = async (id) => {
        if (confirm('Supprimer ce compte ?')) await supprimerCompte(id)
    }

    const estLivret = (compte) => TYPES_LIVRETS.includes(normaliser(compte.type))

    const alertePlafond = (compte) => {
        const plafond = PLAFONDS[normaliser(compte.type)]
        if (!plafond) return null
        const solde = compte.soldeReel ?? compte.solde
        const pourcentage = (solde / plafond) * 100
        if (pourcentage >= 90) return { pourcentage, plafond }
        return null
    }

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Comptes</h1>
                    <p className="text-[var(--text)]">Tes comptes classés par usage.</p>
                </div>
                <button onClick={() => setModalOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                    <Plus size={18} /> Ajouter un compte
                </button>
            </div>

            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : comptes.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-[var(--text)] border border-[var(--border)]">
                    Aucun compte pour l'instant. Clique sur "Ajouter un compte" pour commencer.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupes.filter((g) => g.comptes.length > 0).map((cat) => {
                        const totalCategorie = cat.comptes.reduce((s, c) => s + Number(c.soldeReel ?? c.solde), 0)
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
                                    {cat.comptes.map((compte) => {
                                        const alerte = alertePlafond(compte)
                                        return (
                                            <div
                                                key={compte.id}
                                                className="flex items-center justify-between px-5 py-3.5"
                                                title={compte.commentaire || undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: compte.couleur }} />
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-medium text-[var(--text-h)]">{compte.nom}</p>
                                                            {compte.commentaire && (
                                                                <MessageSquare size={12} className="text-[var(--text-muted)]" />
                                                            )}
                                                            {estLivret(compte) && <BadgeTauxLivret compte={compte} />}
                                                        </div>
                                                        <p className="text-xs text-[var(--text)]">{compte.type}</p>
                                                        {alerte && (
                                                            <p className="text-xs text-amber-500 mt-0.5">
                                                                {alerte.pourcentage.toFixed(0)}% du plafond ({formatMontant(alerte.plafond)})
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-[var(--text-h)]">
                                                        <SecureValue value={compte.soldeReel ?? compte.solde} formatter={(v) => formatMontant(v, compte.devise)} />
                                                    </p>
                                                    {estLivret(compte) && (
                                                        <button onClick={() => setCompteHistoriqueInterets(compte)} title="Voir les intérêts perçus" className="text-[var(--text-muted)] hover:text-emerald transition">
                                                            <PiggyBank size={16} />
                                                        </button>
                                                    )}
                                                    {normaliser(compte.type) === 'livret jeune' && (
                                                        <button onClick={() => setCompteTauxLivretJeune(compte)} title="Modifier le taux" className="text-[var(--text-muted)] hover:text-emerald transition">
                                                            <Percent size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => ouvrirEdition(compte)} className="text-[var(--text-muted)] hover:text-emerald transition">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleSupprimer(compte.id)} className="text-[var(--text-muted)] hover:text-[var(--negative)] transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal ajout compte */}
            <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouveau compte">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Nom du compte</label>
                        <input type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex: Compte Boursorama" className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Type de compte</label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                            {TYPES_COMPTES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                        {['livret a', 'ldds', 'lep'].includes(normaliser(form.type)) && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                Taux national fixé par la Banque de France, appliqué automatiquement.
                            </p>
                        )}
                    </div>

                    {entites.length > 0 && (
                        <div>
                            <label className="text-sm text-[var(--text)] mb-1 block">Rattaché à (Entité)</label>
                            <select value={form.entite_id} onChange={(e) => setForm({ ...form, entite_id: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                                <option value="">Aucune (Globale)</option>
                                {entites.map(e => (
                                    <option key={e.id} value={e.id}>{e.nom}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm text-[var(--text)] mb-1 block">Solde actuel</label>
                            <input type="number" step="0.01" min="0" value={form.solde}
                                onChange={(e) => setForm({ ...form, solde: e.target.value })} placeholder="0.00" className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />
                        </div>
                        <div className="w-28">
                            <label className="text-sm text-[var(--text)] mb-1 block">Devise</label>
                            <select value={form.devise} onChange={(e) => setForm({ ...form, devise: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                                {['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK'].map(devise => <option key={devise} value={devise}>{devise}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Couleur</label>
                        <div className="flex gap-2">
                            {COULEURS.map((couleur) => (
                                <button key={couleur} type="button" onClick={() => setForm({ ...form, couleur })}
                                    className={`w-8 h-8 rounded-full border-2 ${form.couleur === couleur ? 'border-emerald' : 'border-transparent'}`}
                                    style={{ backgroundColor: couleur }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Créer le compte
                    </button>
                </form>
            </Modal>

            {/* Modal édition compte */}
            <Modal isOpen={!!compteEnEdition} onClose={() => setCompteEnEdition(null)} title="Modifier le compte">
                <form onSubmit={handleSubmitEdition} className="space-y-4">
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Nom du compte</label>
                        <input type="text" required value={formEdition.nom}
                            onChange={(e) => setFormEdition({ ...formEdition, nom: e.target.value })}
                            className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Couleur</label>
                        <div className="flex gap-2">
                            {COULEURS.map((couleur) => (
                                <button key={couleur} type="button" onClick={() => setFormEdition({ ...formEdition, couleur })}
                                    className={`w-8 h-8 rounded-full border-2 ${formEdition.couleur === couleur ? 'border-emerald' : 'border-transparent'}`}
                                    style={{ backgroundColor: couleur }} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Commentaire (visible au survol)</label>
                        <textarea rows="3" value={formEdition.commentaire}
                            onChange={(e) => setFormEdition({ ...formEdition, commentaire: e.target.value })}
                            placeholder="Ex: Compte pour les projets perso, à ne pas toucher avant 2027"
                            className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 resize-none" />
                    </div>
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Enregistrer
                    </button>
                </form>
            </Modal>

            {/* Modal historique des intérêts perçus */}
            <ModalHistoriqueInterets compte={compteHistoriqueInterets} onClose={() => setCompteHistoriqueInterets(null)} />

            {/* Modal taux du Livret Jeune */}
            <ModalTauxLivretJeune compte={compteTauxLivretJeune} onClose={() => setCompteTauxLivretJeune(null)} />
        </Layout>
    )
}

export default Comptes