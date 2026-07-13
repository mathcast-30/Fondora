import { useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import BudgetBar from '../components/BudgetBar'
import SankeyChart from '../components/SankeyChart'
import DonutChart from '../components/DonutChart'
import SecureValue from '../components/SecureValue'
import ImportCSVModal from '../components/ImportCSVModal'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useComptes } from '../hooks/useComptes'
import { useBudgets } from '../hooks/useBudgets'
import { Plus, Trash2, ChevronLeft, ChevronRight, Settings2, Upload } from 'lucide-react'
import BudgetGraphiqueSelector from '../components/budget/BudgetGraphiqueSelector'
import BudgetVsReelChart from '../components/budget/BudgetVsReelChart'
import EvolutionTempsChart from '../components/budget/EvolutionTempsChart'
import JaugeEpargneChart from '../components/budget/JaugeEpargneChart'
import Top5DepensesChart from '../components/budget/Top5DepensesChart'

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function Budget() {
    const aujourdHui = new Date()
    const [mois, setMois] = useState(aujourdHui.getMonth() + 1)
    const [annee, setAnnee] = useState(aujourdHui.getFullYear())

    const { transactions, loading, ajouterTransaction, supprimerTransaction } = useTransactions(mois, annee)
    const { categories } = useCategories()
    const { comptes } = useComptes()
    const { budgets, definirBudget } = useBudgets(mois, annee)

    const [modalOuvert, setModalOuvert] = useState(false)
    const [modalBudgetOuvert, setModalBudgetOuvert] = useState(false)
    const [modalImportOuvert, setModalImportOuvert] = useState(false)
    const [form, setForm] = useState({
        description: '', montant: '', type: 'depense',
        compte_id: '', categorie_id: '', date: new Date().toISOString().split('T')[0],
        recurrente: false, jour_recurrence: 1,
    })
    const [budgetForm, setBudgetForm] = useState({})
    
    const [graphiquesVisibles, setGraphiquesVisibles] = useState(() => {
        const saved = localStorage.getItem('fondora_budget_graphiques');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return ['budget_vs_reel', 'evolution_temps', 'objectif_epargne', 'top5_depenses'];
            }
        }
        return ['budget_vs_reel', 'evolution_temps', 'objectif_epargne', 'top5_depenses'];
    });

    const changerMois = (delta) => {
        let m = mois + delta, a = annee
        if (m > 12) { m = 1; a++ }
        if (m < 1) { m = 12; a-- }
        setMois(m); setAnnee(a)
    }

    const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((s, t) => s + Number(t.montant), 0)
    const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + Number(t.montant), 0)
    const solde = totalRevenus - totalDepenses

    // Regroupement des dépenses par catégorie (pour budgets, sankey, donut)
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { error } = await ajouterTransaction({
            ...form,
            montant: parseFloat(form.montant),
            compte_id: form.compte_id || null,
            categorie_id: form.categorie_id || null,
            jour_recurrence: form.recurrente ? Number(new Date(form.date).getDate()) : null,
        })
        if (!error) {
            setForm({ description: '', montant: '', type: 'depense', compte_id: '', categorie_id: '', date: new Date().toISOString().split('T')[0], recurrente: false, jour_recurrence: 1 })
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

    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m)

    const variationsComptes = comptes.map(c => {
        const txCompte = transactions.filter(t => t.compte_id === c.id)
        const diff = txCompte.reduce((s, t) => s + (t.type === 'revenu' ? Number(t.montant) : -Number(t.montant)), 0)
        return { nom: c.nom, diff }
    }).filter(c => c.diff !== 0)

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-navy text-3xl font-bold mb-1">Budget</h1>
                    <p className="text-gray-500">Suivi de tes dépenses et revenus.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setModalBudgetOuvert(true)} className="bg-white border border-gray-200 text-navy font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition hover:bg-gray-50">
                        <Settings2 size={18} /> Définir budgets
                    </button>
                    <button onClick={() => setModalImportOuvert(true)} className="bg-white border border-gray-200 text-navy font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition hover:bg-gray-50">
                        <Upload size={18} /> Importer un CSV
                    </button>
                    <button onClick={() => setModalOuvert(true)} className="bg-emerald hover:bg-emerald-light text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                        <Plus size={18} /> Ajouter
                    </button>
                </div>
            </div>

            {/* Sélecteur de mois */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => changerMois(-1)} className="p-2 bg-white rounded-lg shadow-sm"><ChevronLeft size={18} /></button>
                <span className="font-semibold text-navy">{MOIS_NOMS[mois - 1]} {annee}</span>
                <button onClick={() => changerMois(1)} className="p-2 bg-white rounded-lg shadow-sm"><ChevronRight size={18} /></button>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-gray-400 text-sm mb-1">Revenus</p>
                    <p className="text-emerald font-bold text-xl">+<SecureValue value={totalRevenus} formatter={formatMontant} /></p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-gray-400 text-sm mb-1">Dépenses</p>
                    <p className="text-red-500 font-bold text-xl">-<SecureValue value={totalDepenses} formatter={formatMontant} /></p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-gray-400 text-sm mb-1">Solde</p>
                    <p className={`font-bold text-xl ${solde >= 0 ? 'text-navy' : 'text-red-500'}`}><SecureValue value={solde} formatter={formatMontant} /></p>
                </div>
            </div>

            {variationsComptes.length > 0 && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 text-sm border border-blue-100">
                    <strong>Impact sur vos comptes ce mois-ci :</strong>
                    <ul className="mt-2 space-y-1">
                        {variationsComptes.map((c, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                {c.nom} : <span className={c.diff >= 0 ? 'text-emerald font-semibold' : 'text-red-500 font-semibold'}>{c.diff >= 0 ? '+' : ''}<SecureValue value={c.diff} formatter={formatMontant} /></span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Analyses visuelles */}
            <section className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Analyses visuelles</h2>
                    <BudgetGraphiqueSelector graphiquesVisibles={graphiquesVisibles} setGraphiquesVisibles={setGraphiquesVisibles} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {graphiquesVisibles.includes('budget_vs_reel') && <BudgetVsReelChart transactions={transactions} budgets={budgets} categories={categories} />}
                    {graphiquesVisibles.includes('evolution_temps') && <EvolutionTempsChart />}
                    {graphiquesVisibles.includes('objectif_epargne') && <JaugeEpargneChart epargneRealisee={solde} />}
                    {graphiquesVisibles.includes('top5_depenses') && <Top5DepensesChart transactions={transactions} categories={categories} />}
                </div>
                
                {graphiquesVisibles.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
                        Aucun graphique affiché. Cliquez sur ⚙️ pour en ajouter.
                    </div>
                )}
            </section>

            {/* Graphiques */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-navy font-semibold mb-2">Flux financier</h3>
                    <SankeyChart totalRevenus={totalRevenus} depensesParCategorie={depensesParCategorie} />
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-navy font-semibold mb-2">Répartition des dépenses</h3>
                    <DonutChart data={depensesParCategorie} total={totalDepenses} />
                </div>
            </div>

            {/* Budgets par catégorie */}
            {budgets.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                    <h3 className="text-navy font-semibold mb-4">Suivi des budgets</h3>
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
            {loading ? (
                <p className="text-gray-400">Chargement...</p>
            ) : transactions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">Aucune transaction ce mois-ci.</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm divide-y">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: t.categories?.couleur || '#ccc' }} />
                                <div>
                                    <p className="font-medium text-navy">{t.description || t.categories?.nom || 'Sans description'}</p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center flex-wrap gap-2">
                                        <span>{t.categories?.nom}</span>
                                        <span>•</span>
                                        <span>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                                        {t.recurrente && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">🔁 Récurrente</span>}
                                        {t.source === 'auto_dette' && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">🤖 Auto (Dette)</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className={`font-semibold ${t.type === 'revenu' ? 'text-emerald' : 'text-red-500'}`}>
                                    {t.type === 'revenu' ? '+' : '-'}<SecureValue value={t.montant} formatter={formatMontant} />
                                </p>
                                <button onClick={() => supprimerTransaction(t.id)} className="text-gray-300 hover:text-red-500 transition">
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
                            className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'depense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            Dépense
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, type: 'revenu' })}
                            className={`flex-1 py-2 rounded-lg font-medium ${form.type === 'revenu' ? 'bg-emerald text-white' : 'bg-gray-100 text-gray-500'}`}>
                            Revenu
                        </button>
                    </div>

                    <input type="text" placeholder="Description" value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2" />

                    <input type="number" step="0.01" required placeholder="Montant" value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2" />

                    <select value={form.categorie_id} onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2">
                        <option value="">Choisir une catégorie</option>
                        {categories.filter(c => c.type === form.type).map((c) => (
                            <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                    </select>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="text-sm font-semibold text-gray-700 block mb-1">Associer à un compte</label>
                        <p className="text-xs text-gray-500 mb-2">Permet de mettre à jour automatiquement le solde du compte dans Patrimoine.</p>
                        <select value={form.compte_id} onChange={(e) => setForm({ ...form, compte_id: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 bg-white">
                            <option value="">Aucun compte (solde non impacté)</option>
                            {comptes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                    </div>

                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2" />

                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={form.recurrente}
                            onChange={(e) => setForm({ ...form, recurrente: e.target.checked })} />
                        Dépense/revenu récurrent chaque mois
                    </label>

                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition">
                        Ajouter
                    </button>
                </form>
            </Modal>

            {/* Modal définition des budgets */}
            <Modal isOpen={modalBudgetOuvert} onClose={() => setModalBudgetOuvert(false)} title="Définir les budgets mensuels">
                <form onSubmit={handleSubmitBudgets} className="space-y-3">
                    {categories.filter(c => c.type === 'depense').map((c) => {
                        const budgetExistant = budgets.find(b => b.categorie_id === c.id)
                        return (
                            <div key={c.id} className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.couleur }} />
                                <span className="flex-1 text-sm text-navy">{c.nom}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Max €"
                                    defaultValue={budgetExistant?.montant_max || ''}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, [c.id]: e.target.value })}
                                    className="w-28 border rounded-lg px-2 py-1.5 text-sm"
                                />
                            </div>
                        )
                    })}
                    <button type="submit" className="w-full bg-emerald hover:bg-emerald-light text-white font-semibold py-2 rounded-lg transition mt-4">
                        Enregistrer les budgets
                    </button>
                </form>
            </Modal>

            <ImportCSVModal
                isOpen={modalImportOuvert}
                onClose={() => setModalImportOuvert(false)}
                categories={categories}
                comptes={comptes}
                onImportSuccess={() => { setModalImportOuvert(false); charger() }}
            />
        </Layout>
    )
}

export default Budget