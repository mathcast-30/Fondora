import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import SwitchDevise from '../components/devises/SwitchDevise'
import AffichageTaux from '../components/devises/AffichageTaux'
import { useSmartRules } from '../hooks/useSmartRules'
import { useAlertes } from '../hooks/useAlertes'
import './Parametres.css'

// ─── Config ────────────────────────────────────────────────────────────────
const ALERTE_LABELS = {
    budget_80: { label: 'Budget dépassé à 80%', desc: "Alerte quand tu atteins 80% d'un budget catégorie" },
    budget_100: { label: 'Budget dépassé à 100%', desc: 'Alerte quand tu dépasses un budget catégorie' },
    av_8ans: { label: 'Assurance-Vie proche des 8 ans', desc: 'Rappel à J-90, J-30 et J-7 avant les 8 ans fiscaux' },
    credit_fin: { label: 'Fin de crédit dans 6 mois', desc: "Rappel quand un crédit arrive à son terme" },
    perf_hebdo: { label: 'Résumé hebdo du portefeuille', desc: 'Récap de performance chaque semaine (optionnel)' },
    actif_tangible: { label: 'Réévaluation actifs tangibles', desc: 'Rappel tous les 6 mois de mettre à jour la valeur' },
}

const MODULES_OPTIONS = [
    { key: 'crypto', label: '₿ Crypto' },
    { key: 'immobilier', label: '🏠 Immobilier' },
    { key: 'assurance_vie', label: '🛡️ Assurance Vie' },
    { key: 'bourse', label: '📈 Bourse / ETF' },
    { key: 'actifs_tangibles', label: '💎 Actifs Tangibles' },
]

const SECTIONS = [
    { id: 'devises', label: '💱 Devises' },
    { id: 'profil', label: '👤 Profil' },
    { id: 'preferences', label: '⚙️ Préférences' },
    { id: 'categories', label: '🏷️ Catégories' },
    { id: 'smart_rules', label: '🤖 Règles auto' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'compte', label: '🗑️ Compte' },
]

function Toggle({ value, onChange }) {
    return (
        <div
            onClick={() => onChange(!value)}
            className={`parametres-toggle ${value ? 'parametres-toggle--on' : ''}`}
        >
            <span className="parametres-toggle-knob" />
        </div>
    )
}

export default function Parametres() {
    const [activeSection, setActiveSection] = useState('devises')
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState(null)

    // Profil
    const [nom, setNom] = useState('')
    const [email, setEmail] = useState('')
    const [situationFamiliale, setSituationFamiliale] = useState('celibataire')
    const [newPassword, setNewPassword] = useState('')

    // Préférences
    const [modulesActifs, setModulesActifs] = useState([])

    // Catégories
    const [categories, setCategories] = useState([])
    const [newCategorie, setNewCategorie] = useState({ nom: '', type: 'depense', couleur: '#10b981' })
    const [editingCat, setEditingCat] = useState(null)

    // Smart Rules
    const { rules, loading: rulesLoading, addRule, deleteRule } = useSmartRules()
    const [newRule, setNewRule] = useState({ mot_cle: '', categorie_id: '', priorite: 1 })

    // Alertes
    const { alertes, loading: alertesLoading, toggleAlerte, initAlertes } = useAlertes()

    // Suppression compte
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteStep, setDeleteStep] = useState('idle') // idle | confirm | success
    const [deleteSending, setDeleteSending] = useState(false)

    useEffect(() => {
        loadProfile()
        loadCategories()
    }, [])

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setEmail(user.email || '')
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
            setNom(data.nom || '')
            setSituationFamiliale(data.situation_familiale || 'celibataire')
            setModulesActifs(data.modules_actifs || [])
        }
    }

    async function loadCategories() {
        const { data } = await supabase.from('categories').select('*').order('nom')
        setCategories(data || [])
    }

    function showMsg(text, type = 'success') {
        setMsg({ text, type })
        setTimeout(() => setMsg(null), 3500)
    }

    // ── Profil ────────────────────────────────────────────────────────────────
    async function saveProfil() {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('profiles')
            .update({ nom, situation_familiale: situationFamiliale })
            .eq('id', user.id)
        if (newPassword) {
            const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
            if (pwErr) { showMsg(pwErr.message, 'error'); setSaving(false); return }
            setNewPassword('')
        }
        setSaving(false)
        error ? showMsg(error.message, 'error') : showMsg('Profil mis à jour ✓')
    }

    // ── Préférences ───────────────────────────────────────────────────────────
    async function savePreferences() {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('profiles')
            .update({ modules_actifs: modulesActifs })
            .eq('id', user.id)
        setSaving(false)
        error ? showMsg(error.message, 'error') : showMsg('Préférences sauvegardées ✓')
    }

    function toggleModule(key) {
        setModulesActifs(prev =>
            prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
        )
    }

    // ── Catégories ────────────────────────────────────────────────────────────
    async function addCategorie() {
        if (!newCategorie.nom.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('categories').insert({ ...newCategorie, user_id: user.id })
        loadCategories()
        setNewCategorie({ nom: '', type: 'depense', couleur: '#10b981' })
    }

    async function saveCategorie(cat) {
        await supabase.from('categories')
            .update({ nom: cat.nom, type: cat.type, couleur: cat.couleur })
            .eq('id', cat.id)
        setEditingCat(null)
        loadCategories()
    }

    async function deleteCategorie(id) {
        if (!confirm('Supprimer cette catégorie ? Les transactions liées ne seront pas supprimées.')) return
        await supabase.from('categories').delete().eq('id', id)
        loadCategories()
    }

    // ── Smart Rules ───────────────────────────────────────────────────────────
    async function handleAddRule() {
        if (!newRule.mot_cle.trim() || !newRule.categorie_id) return
        const { error } = await addRule(newRule)
        if (!error) setNewRule({ mot_cle: '', categorie_id: '', priorite: 1 })
    }

    // ── Suppression compte ────────────────────────────────────────────────────
    // Remplace requestDeletion par ces deux fonctions :
    async function confirmDeletion() {
        setDeleteSending(true)
        try {
            const { data, error } = await supabase.functions.invoke('delete-account')
            if (error || data?.error) {
                showMsg(data?.error || error.message, 'error')
                setDeleteSending(false)
                setDeleteStep('idle')
                return
            }
            setDeleteStep('success')
            // Déconnexion après 3 secondes
            setTimeout(async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
            }, 3000)
        } catch (err) {
            showMsg(err.message, 'error')
            setDeleteSending(false)
            setDeleteStep('idle')
        }
    }

    return (
        <Layout>
            <h1 className="parametres-titre">Paramètres</h1>
            <p className="parametres-sous-titre">Personnalise ton expérience Fondora.</p>

            {msg && (
                <div className={`parametres-msg ${msg.type === 'error' ? 'parametres-msg--error' : 'parametres-msg--success'}`}>
                    {msg.text}
                </div>
            )}

            <div className="parametres-layout">
                {/* ── Sidebar ── */}
                <nav className="parametres-nav">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`parametres-nav-btn ${activeSection === s.id ? 'parametres-nav-btn--active' : ''}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </nav>

                <div className="parametres-content">

                    {/* ══ DEVISES ══ */}
                    {activeSection === 'devises' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Devises &amp; Taux de change</h2>
                            <div className="parametres-section-contenu">
                                <SwitchDevise />
                                <div style={{ marginTop: '24px' }}>
                                    <AffichageTaux />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ══ PROFIL ══ */}
                    {activeSection === 'profil' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Profil</h2>
                            <div className="parametres-section-contenu">
                                <div className="parametres-form">
                                    <div className="parametres-field">
                                        <label className="parametres-label">Nom complet</label>
                                        <input
                                            value={nom}
                                            onChange={e => setNom(e.target.value)}
                                            className="parametres-input"
                                            placeholder="Ton prénom et nom"
                                        />
                                    </div>
                                    <div className="parametres-field">
                                        <label className="parametres-label">Email</label>
                                        <input
                                            value={email}
                                            disabled
                                            className="parametres-input parametres-input--disabled"
                                        />
                                        <p className="parametres-hint">L'email ne peut pas être modifié ici</p>
                                    </div>
                                    <div className="parametres-field">
                                        <label className="parametres-label">Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="parametres-input"
                                            placeholder="Laisser vide pour ne pas changer"
                                        />
                                    </div>
                                    <div className="parametres-field">
                                        <label className="parametres-label">Situation familiale</label>
                                        <select
                                            value={situationFamiliale}
                                            onChange={e => setSituationFamiliale(e.target.value)}
                                            className="parametres-input"
                                        >
                                            <option value="celibataire">Célibataire / Divorcé(e) / Veuf(ve)</option>
                                            <option value="marie_pacse">Marié(e) / Pacsé(e)</option>
                                        </select>
                                        <p className="parametres-hint">Impacte les abattements fiscaux (AV, PEA…)</p>
                                    </div>
                                    <button
                                        onClick={saveProfil}
                                        disabled={saving}
                                        className="parametres-btn parametres-btn--primary"
                                    >
                                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ══ PRÉFÉRENCES ══ */}
                    {activeSection === 'preferences' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Préférences</h2>
                            <div className="parametres-section-contenu">
                                <div className="parametres-form">
                                    <div className="parametres-field">
                                        <label className="parametres-label">Modules actifs</label>
                                        <p className="parametres-hint" style={{ marginBottom: '12px' }}>
                                            Active uniquement les modules que tu utilises pour garder l'interface claire.
                                        </p>
                                        <div className="parametres-modules-liste">
                                            {MODULES_OPTIONS.map(m => (
                                                <label key={m.key} className="parametres-module-item">
                                                    <Toggle value={modulesActifs.includes(m.key)} onChange={() => toggleModule(m.key)} />
                                                    <span className="parametres-module-label">{m.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={savePreferences}
                                        disabled={saving}
                                        className="parametres-btn parametres-btn--primary"
                                    >
                                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ══ CATÉGORIES ══ */}
                    {activeSection === 'categories' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Catégories personnalisées</h2>
                            <div className="parametres-section-contenu">
                                <div className="parametres-card--add">
                                    <p className="parametres-label" style={{ marginBottom: '10px' }}>Nouvelle catégorie</p>
                                    <div className="parametres-row-add">
                                        <input
                                            value={newCategorie.nom}
                                            onChange={e => setNewCategorie(p => ({ ...p, nom: e.target.value }))}
                                            placeholder="Nom (ex: Abonnements)"
                                            className="parametres-input"
                                            style={{ flex: 1 }}
                                        />
                                        <select
                                            value={newCategorie.type}
                                            onChange={e => setNewCategorie(p => ({ ...p, type: e.target.value }))}
                                            className="parametres-input"
                                            style={{ width: 130 }}
                                        >
                                            <option value="depense">Dépense</option>
                                            <option value="revenu">Revenu</option>
                                        </select>
                                        <input
                                            type="color"
                                            value={newCategorie.couleur}
                                            onChange={e => setNewCategorie(p => ({ ...p, couleur: e.target.value }))}
                                            className="parametres-color-picker"
                                        />
                                        <button onClick={addCategorie} className="parametres-btn parametres-btn--success">
                                            + Ajouter
                                        </button>
                                    </div>
                                </div>
                                <div className="parametres-liste">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="parametres-liste-item">
                                            <span className="parametres-cat-dot" style={{ backgroundColor: cat.couleur }} />
                                            {editingCat?.id === cat.id ? (
                                                <>
                                                    <input
                                                        value={editingCat.nom}
                                                        onChange={e => setEditingCat(p => ({ ...p, nom: e.target.value }))}
                                                        className="parametres-input parametres-input--inline"
                                                    />
                                                    <select
                                                        value={editingCat.type}
                                                        onChange={e => setEditingCat(p => ({ ...p, type: e.target.value }))}
                                                        className="parametres-input"
                                                        style={{ width: 110 }}
                                                    >
                                                        <option value="depense">Dépense</option>
                                                        <option value="revenu">Revenu</option>
                                                    </select>
                                                    <input
                                                        type="color"
                                                        value={editingCat.couleur}
                                                        onChange={e => setEditingCat(p => ({ ...p, couleur: e.target.value }))}
                                                        className="parametres-color-picker"
                                                    />
                                                    <button onClick={() => saveCategorie(editingCat)} className="parametres-icon-btn parametres-icon-btn--confirm">✓</button>
                                                    <button onClick={() => setEditingCat(null)} className="parametres-icon-btn">✕</button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="parametres-liste-item-nom">{cat.nom}</span>
                                                    <span className="parametres-badge">{cat.type}</span>
                                                    {cat.user_id ? (
                                                        <>
                                                            <button onClick={() => setEditingCat({ ...cat })} className="parametres-icon-btn">✏️</button>
                                                            <button onClick={() => deleteCategorie(cat.id)} className="parametres-icon-btn parametres-icon-btn--danger">🗑️</button>
                                                        </>
                                                    ) : (
                                                        <span className="parametres-hint">par défaut</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ══ SMART RULES ══ */}
                    {activeSection === 'smart_rules' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Règles de catégorisation automatique</h2>
                            <div className="parametres-section-contenu">
                                <p className="parametres-hint" style={{ marginBottom: '16px' }}>
                                    Lors d'un import CSV, si la description contient le mot-clé, la transaction est catégorisée automatiquement.
                                    Une priorité plus basse = appliquée en premier.
                                </p>
                                <div className="parametres-card--add">
                                    <p className="parametres-label" style={{ marginBottom: '10px' }}>Nouvelle règle</p>
                                    <div className="parametres-row-add">
                                        <input
                                            value={newRule.mot_cle}
                                            onChange={e => setNewRule(p => ({ ...p, mot_cle: e.target.value }))}
                                            placeholder="Mot-clé (ex: NETFLIX)"
                                            className="parametres-input parametres-input--mono"
                                            style={{ flex: 1 }}
                                        />
                                        <select
                                            value={newRule.categorie_id}
                                            onChange={e => setNewRule(p => ({ ...p, categorie_id: e.target.value }))}
                                            className="parametres-input"
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">-- Catégorie --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.nom}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={newRule.priorite}
                                            onChange={e => setNewRule(p => ({ ...p, priorite: parseInt(e.target.value) || 1 }))}
                                            min="1" max="99"
                                            placeholder="Priorité"
                                            className="parametres-input"
                                            style={{ width: 90 }}
                                        />
                                        <button onClick={handleAddRule} className="parametres-btn parametres-btn--success">
                                            + Ajouter
                                        </button>
                                    </div>
                                </div>
                                {rulesLoading ? (
                                    <p className="parametres-hint">Chargement…</p>
                                ) : rules.length === 0 ? (
                                    <p className="parametres-empty">Aucune règle définie. Ajoute-en une ci-dessus.</p>
                                ) : (
                                    <div className="parametres-liste">
                                        {rules.map(rule => (
                                            <div key={rule.id} className="parametres-liste-item">
                                                <span className="parametres-badge parametres-badge--priority">P{rule.priorite}</span>
                                                <span className="parametres-rule-keyword">{rule.mot_cle}</span>
                                                <span className="parametres-rule-arrow">→</span>
                                                <span className="parametres-liste-item-nom">{rule.categories?.nom || '—'}</span>
                                                <button onClick={() => deleteRule(rule.id)} className="parametres-icon-btn parametres-icon-btn--danger">🗑️</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ══ NOTIFICATIONS ══ */}
                    {activeSection === 'notifications' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Mes alertes</h2>
                            <div className="parametres-section-contenu">
                                <p className="parametres-hint" style={{ marginBottom: '20px' }}>
                                    Active ou désactive chaque type de notification in-app.
                                </p>
                                {alertesLoading ? (
                                    <p className="parametres-hint">Chargement…</p>
                                ) : alertes.length === 0 ? (
                                    <div className="parametres-empty-block">
                                        <p className="parametres-empty">Aucune alerte configurée.</p>
                                        <button
                                            onClick={async () => {
                                                const { data: { user } } = await supabase.auth.getUser()
                                                await initAlertes(user.id)
                                            }}
                                            className="parametres-btn parametres-btn--primary"
                                            style={{ marginTop: '12px' }}
                                        >
                                            Initialiser les alertes
                                        </button>
                                    </div>
                                ) : (
                                    <div className="parametres-alertes-liste">
                                        {alertes.map(alerte => {
                                            const info = ALERTE_LABELS[alerte.type] || { label: alerte.type, desc: '' }
                                            return (
                                                <div key={alerte.id} className="parametres-alerte-item">
                                                    <Toggle
                                                        value={alerte.actif}
                                                        onChange={(val) => toggleAlerte(alerte.id, val)}
                                                    />
                                                    <div className="parametres-alerte-info">
                                                        <p className="parametres-alerte-label">{info.label}</p>
                                                        <p className="parametres-hint">{info.desc}</p>
                                                    </div>
                                                    <span className={`parametres-badge ${alerte.actif ? 'parametres-badge--on' : 'parametres-badge--off'}`}>
                                                        {alerte.actif ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ══ COMPTE ══ */}
                    {/* ══ COMPTE ══ */}
                    {activeSection === 'compte' && (
                        <section className="parametres-section">
                            <h2 className="parametres-section-titre">Supprimer mon compte</h2>
                            <div className="parametres-section-contenu">

                                {deleteStep === 'success' ? (
                                    <div style={{
                                        background: 'rgba(16,185,129,0.05)',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        maxWidth: '460px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                                        <h3 style={{ color: 'var(--text-h)', margin: '0 0 8px', fontSize: '1.1rem' }}>
                                            Compte supprimé
                                        </h3>
                                        <p style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                                            Toutes tes données ont été définitivement supprimées conformément au RGPD (Art. 17).
                                            Tu vas être déconnecté dans quelques secondes…
                                        </p>
                                    </div>

                                ) : deleteStep === 'confirm' ? (
                                    <div style={{
                                        background: 'rgba(239,68,68,0.05)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        maxWidth: '460px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
                                        <h3 style={{ color: '#f87171', margin: '0 0 12px', fontSize: '1.1rem' }}>
                                            Dernière confirmation
                                        </h3>
                                        <p style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                                            Tu es sur le point de supprimer <strong>définitivement</strong> ton compte et
                                            <strong> toutes tes données</strong> (comptes, transactions, positions, historique…).
                                            <br /><br />
                                            Cette action est <strong style={{ color: '#f87171' }}>irréversible</strong>.
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => { setDeleteStep('idle'); setDeleteConfirm('') }}
                                                className="parametres-btn parametres-btn--primary"
                                                disabled={deleteSending}
                                                style={{ width: 'auto' }}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={confirmDeletion}
                                                disabled={deleteSending}
                                                className="parametres-btn parametres-btn--danger"
                                                style={{ width: 'auto' }}
                                            >
                                                {deleteSending ? '⏳ Suppression…' : '🗑️ Oui, supprimer définitivement'}
                                            </button>
                                        </div>
                                    </div>

                                ) : (
                                    <>
                                        <p className="parametres-hint" style={{ marginBottom: '16px' }}>
                                            Cette action est <strong style={{ color: '#f87171' }}>irréversible</strong>.
                                            Toutes tes données (comptes, transactions, positions, historique…) seront
                                            définitivement supprimées conformément au <strong>RGPD (Art. 17)</strong>.
                                        </p>
                                        <div className="parametres-danger-zone">
                                            <p className="parametres-label" style={{ marginBottom: '8px' }}>
                                                Pour continuer, tape <code className="parametres-code">SUPPRIMER</code> :
                                            </p>
                                            <input
                                                value={deleteConfirm}
                                                onChange={e => setDeleteConfirm(e.target.value)}
                                                placeholder="SUPPRIMER"
                                                className="parametres-input"
                                                style={{ marginBottom: '14px' }}
                                            />
                                            <button
                                                onClick={() => setDeleteStep('confirm')}
                                                disabled={deleteConfirm !== 'SUPPRIMER'}
                                                className="parametres-btn parametres-btn--danger"
                                            >
                                                Continuer →
                                            </button>
                                        </div>
                                    </>
                                )}

                            </div>
                        </section>
                    )}
                </div>
            </div>
        </Layout>
    )
}