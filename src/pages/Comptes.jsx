import { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import SecureValue from '../components/SecureValue'
import BadgeTauxLivret from '../components/BadgeTauxLivret'
import ModalHistoriqueInterets from '../components/ModalHistoriqueInterets'
import ModalTauxLivretJeune from '../components/ModalTauxLivretJeune'
import ModalConfirmationSuppression from '../components/ModalConfirmationSuppression'
import SparklineCompte from '../components/SparklineCompte'
import AvatarBanque from '../components/AvatarBanque'
import AlerteArgentQuiDort from '../components/AlerteArgentQuiDort'
import WidgetRendementEpargne from '../components/WidgetRendementEpargne'
import { useComptes } from '../hooks/useComptes'
import { useEntites } from '../hooks/useEntites'
import { useEntiteFiltre } from '../context/EntiteContext'
import { useInteretsLivret } from '../hooks/useInteretsLivret'
import { useEligibiliteLEP } from '../hooks/useEligibiliteLEP'
import { Wallet, TrendingUp, CreditCard, Home, HelpCircle, Plus, Trash2, Pencil, MessageSquare, PiggyBank, Percent, Search, GripVertical, Archive, RotateCcw, AlertTriangle } from 'lucide-react'

const TYPES_COMPTES = ['Compte courant', 'Compte chèques', 'Épargne', 'Livret A', 'LDDS', 'LEP', 'Livret Jeune', 'Espèces', 'Crédit', 'PEA', 'CTO', 'Assurance vie', 'Crypto', 'Immobilier', 'Autre']
const COULEURS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const TYPES_LIVRETS = ['livret a', 'ldds', 'lep', 'livret jeune']
const PLAFONDS = { 'livret a': 22950, 'ldds': 12000, 'lep': 10000 }
const BANQUES_CONNUES = ['Boursorama', 'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'LCL', 'Crédit Mutuel', 'La Banque Postale', 'Fortuneo', 'ING', 'Revolut', 'N26', 'Hello bank!', 'Caisse d\'Épargne', 'Banque Populaire', 'Autre']

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

// Petite ligne dédiée pour vérifier l'historique d'intérêts avant suppression, sans
// dupliquer la logique du hook dans le composant parent pour chaque compte.
function useAHistoriqueInterets(compteId) {
    const { historique } = useInteretsLivret(compteId)
    return historique.length > 0
}

function LigneCompte({ compte, estLivret, alerte, alerteLEP, formatMontant, onOuvrirInterets, onOuvrirTauxLivretJeune, onEditer, onDemanderSuppression, dragProps }) {
    return (
        <div
            {...dragProps}
            className="flex items-center justify-between px-5 py-3.5 group"
            title={compte.commentaire || undefined}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="opacity-0 group-hover:opacity-40 cursor-grab shrink-0 text-[var(--text-muted)]" title="Glisser pour réordonner">
                    <GripVertical size={14} />
                </span>
                {compte.banque
                    ? <AvatarBanque banque={compte.banque} />
                    : <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: compte.couleur }} />}
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-medium text-[var(--text-h)] truncate">{compte.nom}</p>
                        {compte.commentaire && <MessageSquare size={12} className="text-[var(--text-muted)] shrink-0" />}
                        {estLivret && <BadgeTauxLivret compte={compte} />}
                    </div>
                    <p className="text-xs text-[var(--text)]">{compte.type}{compte.banque ? ` · ${compte.banque}` : ''}</p>
                    {alerte && (
                        <p className="text-xs text-amber-500 mt-0.5">
                            {alerte.pourcentage.toFixed(0)}% du plafond ({formatMontant(alerte.plafond)})
                        </p>
                    )}
                    {alerteLEP && (
                        <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> RFR au-dessus du plafond LEP - risque de clôture
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <SparklineCompte compte={compte} />
                <p className="font-semibold text-[var(--text-h)]">
                    <SecureValue value={compte.soldeReel ?? compte.solde} formatter={(v) => formatMontant(v, compte.devise)} />
                </p>
                {estLivret && (
                    <button onClick={() => onOuvrirInterets(compte)} title="Voir les intérêts" className="text-[var(--text-muted)] hover:text-emerald transition">
                        <PiggyBank size={16} />
                    </button>
                )}
                {normaliser(compte.type) === 'livret jeune' && (
                    <button onClick={() => onOuvrirTauxLivretJeune(compte)} title="Modifier le taux" className="text-[var(--text-muted)] hover:text-emerald transition">
                        <Percent size={16} />
                    </button>
                )}
                <button onClick={() => onEditer(compte)} className="text-[var(--text-muted)] hover:text-emerald transition">
                    <Pencil size={16} />
                </button>
                <button onClick={() => onDemanderSuppression(compte)} className="text-[var(--text-muted)] hover:text-[var(--negative)] transition">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}

function Comptes() {
    const { comptes, loading, ajouterCompte, modifierCompte, supprimerDefinitivement, cloturerCompte, reactiverCompte, reordonnerComptes } = useComptes()
    const { entites } = useEntites()
    const { entiteFiltre } = useEntiteFiltre()
    const { eligible: eligibleLEP, rfrRenseigne } = useEligibiliteLEP()

    const [modalOuvert, setModalOuvert] = useState(false)
    const [recherche, setRecherche] = useState('')
    const [afficherClotures, setAfficherClotures] = useState(false)
    const [form, setForm] = useState({
        nom: '', type: 'Compte courant', banque: '', solde: '', devise: 'EUR', couleur: COULEURS[0],
        frais_gestion_enveloppe: 0.60, frais_courtage_pourcentage: 0.20,
        entite_id: entiteFiltre || ''
    })

    const [compteEnEdition, setCompteEnEdition] = useState(null)
    const [formEdition, setFormEdition] = useState({ nom: '', banque: '', couleur: COULEURS[0], commentaire: '' })
    const [compteHistoriqueInterets, setCompteHistoriqueInterets] = useState(null)
    const [compteTauxLivretJeune, setCompteTauxLivretJeune] = useState(null)
    const [compteASupprimer, setCompteASupprimer] = useState(null)
    const [dragCompteId, setDragCompteId] = useState(null)

    const ouvrirEdition = (compte) => {
        setCompteEnEdition(compte)
        setFormEdition({ nom: compte.nom, banque: compte.banque || '', couleur: compte.couleur || COULEURS[0], commentaire: compte.commentaire || '' })
    }

    const handleSubmitEdition = async (e) => {
        e.preventDefault()
        const { error } = await modifierCompte(compteEnEdition.id, {
            nom: formEdition.nom, banque: formEdition.banque || null,
            couleur: formEdition.couleur, commentaire: formEdition.commentaire || null
        })
        if (!error) setCompteEnEdition(null)
    }

    const formatMontant = (montant, devise = 'EUR') =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise }).format(montant)

    // Filtrage actif/clôturé + recherche texte
    const rechercheNormalisee = normaliser(recherche)
    const comptesVisibles = comptes.filter((c) => {
        const statutOk = afficherClotures ? c.statut === 'cloture' : (c.statut ?? 'actif') === 'actif'
        const rechercheOk = !rechercheNormalisee || normaliser(c.nom).includes(rechercheNormalisee) || normaliser(c.type).includes(rechercheNormalisee) || normaliser(c.banque).includes(rechercheNormalisee)
        return statutOk && rechercheOk
    })

    const idsClasses = new Set()
    const groupes = CATEGORIES.map((cat) => {
        const comptesCategorie = comptesVisibles.filter((c) => {
            const match = cat.types.includes(normaliser(c.type))
            if (match) idsClasses.add(c.id)
            return match
        })
        return { ...cat, comptes: comptesCategorie }
    })
    const comptesNonClasses = comptesVisibles.filter((c) => !idsClasses.has(c.id))
    if (comptesNonClasses.length > 0) {
        groupes.push({
            id: 'autres', titre: 'Autres comptes',
            description: "Comptes dont le type ne correspond à aucune catégorie ci-dessus.",
            icone: HelpCircle, couleur: '#94a3b8', comptes: comptesNonClasses,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const typeNormalise = normaliser(form.type)
        const estLivretJeune = typeNormalise === 'livret jeune'

        const { error, data } = await ajouterCompte({
            nom: form.nom, type: form.type, banque: form.banque || null,
            entite_id: form.entite_id || null,
            solde: parseFloat(form.solde) || 0,
            devise: form.devise, couleur: form.couleur,
            frais_gestion_enveloppe: parseFloat(form.frais_gestion_enveloppe) || 0,
            frais_courtage_pourcentage: parseFloat(form.frais_courtage_pourcentage) || 0
        })

        if (!error) {
            setForm({ nom: '', type: 'Compte courant', banque: '', solde: '', devise: 'EUR', couleur: COULEURS[0], frais_gestion_enveloppe: 0.60, frais_courtage_pourcentage: 0.20, entite_id: entiteFiltre || '' })
            setModalOuvert(false)
            if (estLivretJeune && data) setCompteTauxLivretJeune(data)
        }
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

    // Drag & drop natif (HTML5), pas de dépendance supplémentaire
    const handleDrop = async (categorieComptes, compteCibleId) => {
        if (!dragCompteId || dragCompteId === compteCibleId) return
        const ids = categorieComptes.map((c) => c.id)
        const depart = ids.indexOf(dragCompteId)
        const arrivee = ids.indexOf(compteCibleId)
        if (depart === -1 || arrivee === -1) return
        ids.splice(depart, 1)
        ids.splice(arrivee, 0, dragCompteId)
        setDragCompteId(null)
        await reordonnerComptes(ids)
    }

    return (
        <Layout>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Comptes</h1>
                    <p className="text-[var(--text)]">Tes comptes classés par usage.</p>
                </div>
                <button onClick={() => setModalOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                    <Plus size={18} /> Ajouter un compte
                </button>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        value={recherche} onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher un compte, une banque..."
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg pl-9 pr-3 py-2 text-sm"
                    />
                </div>
                <button
                    onClick={() => setAfficherClotures(!afficherClotures)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${afficherClotures ? 'bg-emerald text-white border-emerald' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
                >
                    <Archive size={13} /> {afficherClotures ? 'Comptes clôturés' : 'Voir les comptes clôturés'}
                </button>
                {!afficherClotures && <WidgetRendementEpargne comptes={comptesVisibles} />}
            </div>

            {!afficherClotures && <AlerteArgentQuiDort comptes={comptesVisibles} />}

            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : comptesVisibles.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-[var(--text)] border border-[var(--border)]">
                    {afficherClotures ? "Aucun compte clôturé." : recherche ? "Aucun compte ne correspond à ta recherche." : 'Aucun compte pour l\'instant. Clique sur "Ajouter un compte" pour commencer.'}
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
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.couleur}20` }}>
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
                                        const alerte = afficherClotures ? null : alertePlafond(compte)
                                        const alerteLEP = !afficherClotures && normaliser(compte.type) === 'lep' && rfrRenseigne && eligibleLEP === false
                                        return afficherClotures ? (
                                            <div key={compte.id} className="flex items-center justify-between px-5 py-3.5 opacity-70">
                                                <div>
                                                    <p className="font-medium text-[var(--text-h)]">{compte.nom}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">Clôturé le {new Date(compte.date_cloture).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[var(--text)]">{formatMontant(compte.soldeReel ?? compte.solde, compte.devise)}</p>
                                                    <button onClick={() => reactiverCompte(compte.id)} title="Réactiver" className="text-[var(--text-muted)] hover:text-emerald transition">
                                                        <RotateCcw size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <LigneCompte
                                                key={compte.id}
                                                compte={compte}
                                                estLivret={estLivret(compte)}
                                                alerte={alerte}
                                                alerteLEP={alerteLEP}
                                                formatMontant={formatMontant}
                                                onOuvrirInterets={setCompteHistoriqueInterets}
                                                onOuvrirTauxLivretJeune={setCompteTauxLivretJeune}
                                                onEditer={ouvrirEdition}
                                                onDemanderSuppression={setCompteASupprimer}
                                                dragProps={{
                                                    draggable: true,
                                                    onDragStart: () => setDragCompteId(compte.id),
                                                    onDragOver: (e) => e.preventDefault(),
                                                    onDrop: () => handleDrop(cat.comptes, compte.id),
                                                }}
                                            />
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
                            <p className="text-xs text-[var(--text-muted)] mt-1">Taux national fixé par la Banque de France, appliqué automatiquement.</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm text-[var(--text)] mb-1 block">Banque (optionnel)</label>
                        <select value={form.banque} onChange={(e) => setForm({ ...form, banque: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                            <option value="">Aucune / peu importe</option>
                            {BANQUES_CONNUES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    {entites.length > 0 && (
                        <div>
                            <label className="text-sm text-[var(--text)] mb-1 block">Rattaché à (Entité)</label>
                            <select value={form.entite_id} onChange={(e) => setForm({ ...form, entite_id: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                                <option value="">Aucune (Globale)</option>
                                {entites.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
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
                        <label className="text-sm text-[var(--text)] mb-1 block">Couleur (si pas de banque choisie)</label>
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
                        <label className="text-sm text-[var(--text)] mb-1 block">Banque</label>
                        <select value={formEdition.banque} onChange={(e) => setFormEdition({ ...formEdition, banque: e.target.value })} className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                            <option value="">Aucune / peu importe</option>
                            {BANQUES_CONNUES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
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

            <ModalHistoriqueInterets compte={compteHistoriqueInterets} onClose={() => setCompteHistoriqueInterets(null)} />
            <ModalTauxLivretJeune compte={compteTauxLivretJeune} onClose={() => setCompteTauxLivretJeune(null)} />
            <ModalConfirmationSuppression
                compte={compteASupprimer}
                soldeReel={compteASupprimer ? Number(compteASupprimer.soldeReel ?? compteASupprimer.solde) : 0}
                hasHistorique={compteASupprimer ? useAHistoriqueInterets(compteASupprimer.id) : false}
                onClose={() => setCompteASupprimer(null)}
                onCloturer={async (id) => { await cloturerCompte(id); setCompteASupprimer(null) }}
                onSupprimerDefinitivement={async (id) => { await supprimerDefinitivement(id); setCompteASupprimer(null) }}
            />
        </Layout>
    )
}

export default Comptes