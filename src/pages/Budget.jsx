import { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import BudgetBar from '../components/BudgetBar'
import SankeyChart from '../components/SankeyChart'
import DonutChart from '../components/DonutChart'
import SecureValue from '../components/SecureValue'
import ImportCSVModal from '../components/import/ImportCSVModal'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useComptes } from '../hooks/useComptes'
import { useBudgets } from '../hooks/useBudgets'
import { useAbonnements } from '../hooks/useAbonnements'
import { Plus, Trash2, ChevronLeft, ChevronRight, Settings2, Upload, Download } from 'lucide-react'
import BudgetGraphiqueSelector from '../components/budget/BudgetGraphiqueSelector'
import BudgetVsReelChart from '../components/budget/BudgetVsReelChart'
import EvolutionTempsChart from '../components/budget/EvolutionTempsChart'
import JaugeEpargneChart from '../components/budget/JaugeEpargneChart'
import Top5DepensesChart from '../components/budget/Top5DepensesChart'
import WidgetRestantAVivre from '../components/budget/WidgetRestantAVivre'
import WidgetWhatIf from '../components/budget/WidgetWhatIf'
import CalendrierEcheances from '../components/budget/CalendrierEcheances'
import SubscriptionCleaner from '../components/budget/SubscriptionCleaner'
import { calculerRestantAVivre } from '../utils/budgetCalculator'
import { genererBilanBudget } from '../utils/exportBilanBudget'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useObjectifEpargne } from '../hooks/useObjectifEpargne'
import { exportBudgetToExcel } from '../utils/exportToExcel'
import ExportButton from '../components/ExportButton'

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function Budget() {
    const { user, profile } = useAuth()
    const aujourdHui = new Date()
    const [mois, setMois] = useState(aujourdHui.getMonth() + 1)
    const [annee, setAnnee] = useState(aujourdHui.getFullYear())
    const { objectif: objectifEpargne } = useObjectifEpargne(mois, annee)

    const { transactions, loading, ajouterTransaction, supprimerTransaction, recategoriserTransactions, charger } = useTransactions(mois, annee)
    const { categories } = useCategories()
    const { comptes } = useComptes()
    const { budgets, definirBudget } = useBudgets(mois, annee)
    const {
        abonnements, loading: loadingAb,
        ajouterAbonnement, planifierResiliation, supprimerAbonnement,
    } = useAbonnements()

    const [modalOuvert, setModalOuvert] = useState(false)
    const [modalBudgetOuvert, setModalBudgetOuvert] = useState(false)
    const [modalImportOuvert, setModalImportOuvert] = useState(false)
    const [compteSelectionne, setCompteSelectionne] = useState('')
    const [categorieFiltree, setCategorieFiltree] = useState(null)
    const [demandeRecategorisation, setDemandeRecategorisation] = useState(null)
    const [recategorisationEnCours, setRecategorisationEnCours] = useState(false)

    useEffect(() => {
        if (comptes && comptes.length > 0 && !compteSelectionne) {
            setCompteSelectionne(comptes[0].id)
        }
    }, [comptes, compteSelectionne])

    useEffect(() => {
        if (comptes && comptes.length === 1) {
            setForm(prev => prev.compte_id ? prev : { ...prev, compte_id: comptes[0].id })
        }
    }, [comptes])

    const [form, setForm] = useState({
        description: '', montant: '', type: 'depense',
        compte_id: '', categorie_id: '', date: new Date().toISOString().split('T')[0],
        recurrente: false, jour_recurrence: 1,
    })
    const [budgetForm, setBudgetForm] = useState({})

    const [graphiquesVisibles, setGraphiquesVisibles] = useState(() => {
        const saved = localStorage.getItem('fondora_budget_graphiques')
        if (saved) {
            try { return JSON.parse(saved) } catch { /* noop */ }
        }
        return ['restant_a_vivre', 'what_if', 'echeances', 'abonnements', 'budget_vs_reel', 'evolution_temps', 'objectif_epargne', 'top5_depenses', 'flux_financier', 'repartition_depenses', 'budgets']
    })

    useEffect(() => {
        if (Array.isArray(profile?.budget_widgets)) setGraphiquesVisibles(profile.budget_widgets)
    }, [profile?.budget_widgets])

    const sauvegarderWidgets = async (widgets) => {
        setGraphiquesVisibles(widgets)
        localStorage.setItem('fondora_budget_graphiques', JSON.stringify(widgets))
        if (user) await supabase.from('profiles').update({ budget_widgets: widgets }).eq('id', user.id)
    }

    const changerMois = (delta) => {
        let m = mois + delta, a = annee
        if (m > 12) { m = 1; a++ }
        if (m < 1) { m = 12; a-- }
        setMois(m); setAnnee(a)
    }

    const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
    const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
    const solde = totalRevenus - totalDepenses

    const depensesParCategorie = categories
        .filter(c => c.type === 'depense')
        .map(c => ({
            id: c.id,
            nom: c.nom,
            couleur: c.couleur,
            montant: transactions
                .filter(t => t.type === 'depense' && t.categorie_id === c.id)
                .reduce((s, t) => s + Number(t.montant), 0),
        }))
        .filter(c => c.montant > 0)

    const soldeTotalCourants = useMemo(() =>
        comptes
            .filter(c => (c.type || '').toLowerCase().includes('courant'))
            .reduce((s, c) => s + Number(c.soldeReel ?? c.solde ?? 0), 0),
        [comptes]
    )

    const depensesRecurrentes = useMemo(() => transactions
        .filter(t => t.type === 'depense' && t.recurrente && t.recurrence_active !== false)
        .map(t => ({ montant: t.montant, jour_prelevement: t.jour_recurrence || new Date(t.date).getDate() })), [transactions])
    const objectifEpargneMois = Number(objectifEpargne?.montant_cible || 0)
    const restantAVivre = useMemo(() =>
        calculerRestantAVivre({
            soldeComptesCourants: soldeTotalCourants,
            depensesRecurrentes: [...abonnements, ...depensesRecurrentes],
            objectifsEpargneMois: objectifEpargneMois,
        }),
        [soldeTotalCourants, abonnements, depensesRecurrentes, objectifEpargneMois]
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await ajouterTransaction({
            ...form,
            montant: Math.abs(parseFloat(form.montant)),
            compte_id: form.compte_id,
            categorie_id: form.categorie_id || null,
            jour_recurrence: form.recurrente ? Number(new Date(form.date).getDate()) : null,
        })
        if (!error) {
            const compteDefaut = comptes.length === 1 ? comptes[0].id : ''
            setForm({ description: '', montant: '', type: 'depense', compte_id: compteDefaut, categorie_id: '', date: new Date().toISOString().split('T')[0], recurrente: false, jour_recurrence: 1 })
            setModalOuvert(false)
        }
    }

    const handleSubmitBudgets = async (e) => {
        e.preventDefault()
        for (const [categorieId, montant] of Object.entries(budgetForm)) {
            if (montant) await definirBudget(categorieId, parseFloat(montant))
        }
        setModalBudgetOuvert(false)
    }

    const confirmerRecategorisation = async () => {
        if (!demandeRecategorisation) return
        const { source, cible } = demandeRecategorisation
        const categorieCible = categories.find(c => c.nom === cible)
        if (!categorieCible) { setDemandeRecategorisation(null); return }

        const idsAModifier = transactions.filter(t => t.categories?.nom === source).map(t => t.id)
        setRecategorisationEnCours(true)
        await recategoriserTransactions(idsAModifier, categorieCible.id)
        setRecategorisationEnCours(false)
        setDemandeRecategorisation(null)
        if (categorieFiltree === source) setCategorieFiltree(cible)
    }

    const handleExportBilan = () => {
        genererBilanBudget({
            transactions, budgets, categories, mois, annee,
            totalRevenus, totalDepenses, solde,
        })
    }

    const handleExportToExcel = () => {
        const budgetData = {
            totalRevenus,
            totalDepenses,
            monthlyBudget: budgets.reduce((sum, b) => sum + Number(b.montant_max || 0), 0),
            monthlyActual: totalDepenses,
        };
        exportBudgetToExcel(budgetData, transactions, comptes);
    };

    const handleSupprimerTransaction = async (transaction) => {
        const supprimerSerie = transaction.recurrente && window.confirm('OK : supprimer toute la série récurrente. Annuler : supprimer uniquement cette occurrence.')
        if (!transaction.recurrente && !window.confirm('Supprimer cette transaction ?')) return
        await supprimerTransaction(transaction.id, supprimerSerie)
    }

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const variationsComptes = comptes.map(c => {
        const txCompte = transactions.filter(t => t.compte_id === c.id)
        const diff = txCompte.reduce((s, t) => s + (t.type === 'revenu' ? Number(t.montant) : -Number(t.montant)), 0)
        return { nom: c.nom, diff }
    }).filter(c => c.diff !== 0)

    const transactionsAffichees = categorieFiltree
        ? transactions.filter(t => t.categories?.nom === categorieFiltree)
        : transactions

    return (
        <Layout>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[var(--text-h)] text-3xl font-bold mb-1">Budget</h1>
                    <p className="text-[var(--text)]">Suivi de tes dépenses et revenus.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setModalBudgetOuvert(true)} className="bg-card border border-[var(--border)] text-[var(--text-h)] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition hover:bg-[var(--bg-card-hover)]">
                        <Settings2 size={18} /> Définir budgets
                    </button>
                    <button onClick={handleExportBilan} className="bg-card border border-[var(--border)] text-[var(--text-h)] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition hover:bg-[var(--bg-card-hover)]">
                        <Download size={18} /> Générer mon bilan
                    </button>
                    <ExportButton onClick={handleExportToExcel} />
                    <button onClick={() => setModalImportOuvert(true)} className="bg-card border border-[var(--border)] text-[var(--text-h)] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition hover:bg-[var(--bg-card-hover)]">
                        <Upload size={18} /> Importer un CSV
                    </button>
                    <button onClick={() => setModalOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                        <Plus size={18} /> Ajouter
                    </button>
                </div>
            </div>

            {/* Sélecteur de mois */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => changerMois(-1)} className="p-2 bg-surface rounded-lg border border-[var(--border)] text-[var(--text-h)]"><ChevronLeft size={18} /></button>
                <span className="font-semibold text-[var(--text-h)]">{MOIS_NOMS[mois - 1]} {annee}</span>
                <button onClick={() => changerMois(1)} className="p-2 bg-surface rounded-lg border border-[var(--border)] text-[var(--text-h)]"><ChevronRight size={18} /></button>
            </div>

            {/* Résumé Revenus / Dépenses / Solde */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-card rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-[var(--text)] text-sm mb-1">Revenus</p>
                    <p className="text-emerald font-bold text-xl">+<SecureValue value={totalRevenus} formatter={formatMontant} /></p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-[var(--text)] text-sm mb-1">Dépenses</p>
                    <p className="text-[var(--negative)] font-bold text-xl">-<SecureValue value={totalDepenses} formatter={formatMontant} /></p>
                </div>
                <div className="bg-card rounded-xl p-4 border border-[var(--border)]">
                    <p className="text-[var(--text)] text-sm mb-1">Solde</p>
                    <p className={`font-bold text-xl ${solde >= 0 ? 'text-[var(--text-h)]' : 'text-[var(--negative)]'}`}>
                        <SecureValue value={solde} formatter={formatMontant} />
                    </p>
                </div>
            </div>

            {/* BENTO GRID — Widgets enrichis */}
            <section className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {graphiquesVisibles.includes('restant_a_vivre') && <WidgetRestantAVivre {...restantAVivre} />}
                    {graphiquesVisibles.includes('what_if') && <WidgetWhatIf objectifMensuel={objectifEpargneMois} restantAVivre={restantAVivre.restantAVivreReel} />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {graphiquesVisibles.includes('echeances') && <CalendrierEcheances
                        abonnements={abonnements}
                        mois={mois}
                        annee={annee}
                    />}
                    {graphiquesVisibles.includes('abonnements') && <SubscriptionCleaner
                        abonnements={abonnements}
                        loading={loadingAb}
                        onAjouter={ajouterAbonnement}
                        onPlanifierResiliation={planifierResiliation}
                        onSupprimer={supprimerAbonnement}
                    />}
                </div>
            </section>

            {/* Impact comptes */}
            {variationsComptes.length > 0 && (
                <div className="bg-blue-500/10 text-blue-300 p-4 rounded-xl mb-6 text-sm border border-blue-500/20">
                    <strong>Impact sur vos comptes ce mois-ci :</strong>
                    <ul className="mt-2 space-y-1">
                        {variationsComptes.map((c, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {c.nom} : <span className={c.diff >= 0 ? 'text-emerald font-semibold' : 'text-[var(--negative)] font-semibold'}>
                                    {c.diff >= 0 ? '+' : ''}<SecureValue value={c.diff} formatter={formatMontant} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Analyses visuelles */}
            <section className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[var(--text-h)]">Analyses visuelles</h2>
                    <BudgetGraphiqueSelector graphiquesVisibles={graphiquesVisibles} setGraphiquesVisibles={sauvegarderWidgets} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {graphiquesVisibles.includes('budget_vs_reel') && <BudgetVsReelChart transactions={transactions} budgets={budgets} categories={categories} />}
                    {graphiquesVisibles.includes('evolution_temps') && <EvolutionTempsChart />}
                    {graphiquesVisibles.includes('objectif_epargne') && <JaugeEpargneChart epargneRealisee={Math.max(0, solde)} objectifMensuel={objectifEpargneMois} />}
                    {graphiquesVisibles.includes('top5_depenses') && <Top5DepensesChart transactions={transactions} categories={categories} />}
                </div>

                {graphiquesVisibles.length === 0 && (
                    <div className="text-center py-12 text-[var(--text)] bg-card rounded-xl border border-[var(--border)] mt-4">
                        Aucun graphique affiché. Cliquez sur ⚙️ pour en ajouter.
                    </div>
                )}
            </section>

            {/* Flux financier + Donut */}
            {(graphiquesVisibles.includes('flux_financier') || graphiquesVisibles.includes('repartition_depenses')) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {graphiquesVisibles.includes('flux_financier') && <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                    <h3 className="text-[var(--text-h)] font-semibold mb-2">Flux financier</h3>
                    <SankeyChart
                        totalRevenus={totalRevenus}
                        depensesParCategorie={depensesParCategorie}
                        categorieFiltree={categorieFiltree}
                        onFiltrerCategorie={setCategorieFiltree}
                        onDemandeRecategorisation={(source, cible) => setDemandeRecategorisation({ source, cible })}
                    />
                </div>}
                {graphiquesVisibles.includes('repartition_depenses') && <div className="bg-card rounded-xl p-5 border border-[var(--border)]">
                    <h3 className="text-[var(--text-h)] font-semibold mb-2">Répartition des dépenses</h3>
                    <DonutChart data={depensesParCategorie} total={totalDepenses} />
                </div>}
            </div>}

            {/* Budgets par catégorie */}
            {graphiquesVisibles.includes('budgets') && budgets.length > 0 && (
                        <div className="bg-card rounded-xl p-5 border border-[var(--border)] mb-6">
                            <h3 className="text-[var(--text-h)] font-semibold mb-4">Suivi des budgets</h3>
                            <p className="text-xs text-[var(--text-muted)] -mt-2 mb-4">Les enveloppes sont reprises automatiquement chaque mois. Une modification s’applique à partir de ce mois.</p>
                    {budgets.map((b) => {
                        const depense = transactions
                            .filter(t => t.categorie_id === b.categorie_id && t.type === 'depense')
                            .reduce((s, t) => s + Number(t.montant), 0)
                        return (
                            <BudgetBar
                                key={b.id}
                                nom={b.categories?.nom}
                                couleur={b.categories?.couleur}
                                depense={depense}
                                budgetMax={Number(b.montant_max)}
                            />
                        )
                    })}
                </div>
            )}

            {/* Liste des transactions */}
            {categorieFiltree && (
                <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-4 py-2.5 rounded-xl mb-3">
                    <span>Filtré sur la catégorie <strong>{categorieFiltree}</strong> ({transactionsAffichees.length} transaction{transactionsAffichees.length > 1 ? 's' : ''})</span>
                    <button onClick={() => setCategorieFiltree(null)} className="text-blue-300 hover:text-white text-xs underline">
                        Réinitialiser
                    </button>
                </div>
            )}
            {loading ? (
                <p className="text-[var(--text)]">Chargement...</p>
            ) : transactionsAffichees.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center text-[var(--text)] border border-[var(--border)]">Aucune transaction ce mois-ci.</div>
            ) : (
                <div className="bg-card rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                    {transactionsAffichees.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: t.categories?.couleur || '#ccc' }} />
                                <div>
                                    <p className="font-medium text-[var(--text-h)]">{t.description || t.categories?.nom || 'Sans description'}</p>
                                    <p className="text-xs text-[var(--text)] mt-1 flex items-center flex-wrap gap-2">
                                        <span>{t.categories?.nom}</span>
                                        <span>•</span>
                                        <span>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                                        {t.recurrente && <span className="bg-surface text-[var(--text)] px-1.5 py-0.5 rounded border border-[var(--border)]">🔁 Récurrente</span>}
                                        {t.source === 'auto_dette' && <span className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded font-medium">🤖 Auto (Dette)</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`font-semibold ${t.type === 'revenu' ? 'text-emerald' : 'text-[var(--negative)]'}`}>
                                    {t.type === 'revenu' ? '+' : '-'}<SecureValue value={t.montant} formatter={formatMontant} />
                                </p>
                                <button onClick={() => handleSupprimerTransaction(t)} aria-label="Supprimer la transaction" className="text-[var(--text-muted)] hover:text-[var(--negative)] transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal ajout transaction */}
            <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Nouvelle transaction">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setForm({ ...form, type: 'depense' })}
                            className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'depense' ? 'bg-[var(--negative)] text-white' : 'bg-surface text-[var(--text)]'}`}>
                            Dépense
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, type: 'revenu' })}
                            className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'revenu' ? 'bg-emerald text-white' : 'bg-surface text-[var(--text)]'}`}>
                            Revenu
                        </button>
                    </div>

                    <input type="text" placeholder="Description" value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2 placeholder-[var(--text-muted)]" />

                    <input type="number" step="0.01" min="0" required placeholder="Montant" value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />

                    <select value={form.categorie_id} onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2">
                        <option value="">Choisir une catégorie</option>
                        {categories.filter(c => c.type === form.type).map((c) => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                    </select>

                    <div className="bg-surface p-3 rounded-lg border border-[var(--border)]">
                        <label className="text-sm font-semibold text-[var(--text-h)] block mb-1">
                            Compte <span className="text-[var(--negative)]">*</span>
                        </label>
                        <p className="text-xs text-[var(--text)] mb-2">Obligatoire — met à jour automatiquement le solde du compte dans Patrimoine.</p>
                        <select
                            value={form.compte_id}
                            onChange={(e) => setForm({ ...form, compte_id: e.target.value })}
                            required
                            className="w-full border border-[var(--border)] bg-card text-[var(--text-h)] rounded-lg px-3 py-2">
                            <option value="" disabled>Choisir un compte…</option>
                            {comptes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                    </div>

                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-3 py-2" />

                    <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                        <input type="checkbox" checked={form.recurrente}
                            onChange={(e) => setForm({ ...form, recurrente: e.target.checked })} />
                        Dépense/revenu récurrent chaque mois
                    </label>

                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Ajouter
                    </button>
                </form>
            </Modal>

            {/* Modal budgets */}
            <Modal isOpen={modalBudgetOuvert} onClose={() => setModalBudgetOuvert(false)} title="Définir les budgets mensuels">
                <form onSubmit={handleSubmitBudgets} className="flex flex-col gap-3">
                    <div className="overflow-y-auto max-h-[60vh] space-y-3 pr-1">
                        {categories.filter(c => c.type === 'depense').map((c) => {
                            const budgetExistant = budgets.find(b => b.categorie_id === c.id)
                            return (
                                <div key={c.id} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.couleur }} />
                                    <span className="flex-1 text-sm text-[var(--text-h)]">{c.nom}</span>
                                    <input
                                        type="number" step="0.01" placeholder="Max €"
                                        defaultValue={budgetExistant?.montant_max || ''}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, [c.id]: e.target.value })}
                                        className="w-28 border border-[var(--border)] bg-surface text-[var(--text-h)] rounded-lg px-2 py-1.5 text-sm"
                                    />
                                </div>
                            )
                        })}
                    </div>
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition mt-2">
                        Enregistrer les budgets
                    </button>
                </form>
            </Modal>

            {/* Modal confirmation recatégorisation (Sankey) */}
            <Modal isOpen={!!demandeRecategorisation} onClose={() => setDemandeRecategorisation(null)} title="Recatégoriser des transactions">
                {demandeRecategorisation && (
                    <div className="space-y-4">
                        <p className="text-[var(--text)] text-sm">
                            Voulez-vous recatégoriser les transactions de{' '}
                            <strong className="text-[var(--text-h)]">{demandeRecategorisation.source}</strong> vers{' '}
                            <strong className="text-emerald-400">{demandeRecategorisation.cible}</strong> ?
                        </p>
                        <p className="text-xs text-[var(--text)]">
                            {transactions.filter(t => t.categories?.nom === demandeRecategorisation.source).length} transaction(s) concernée(s) ce mois-ci.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDemandeRecategorisation(null)}
                                className="flex-1 bg-surface border border-[var(--border)] text-[var(--text-h)] font-semibold py-2 rounded-lg transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmerRecategorisation}
                                disabled={recategorisationEnCours}
                                className="flex-1 bg-emerald hover:bg-emerald-light disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
                            >
                                {recategorisationEnCours ? 'Application…' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal import CSV */}
            {modalImportOuvert && (
                <ImportCSVModal
                    compteId={compteSelectionne}
                    onFerme={() => {
                        setModalImportOuvert(false)
                        charger()
                    }}
                />
            )}
        </Layout>
    )
}

export default Budget
