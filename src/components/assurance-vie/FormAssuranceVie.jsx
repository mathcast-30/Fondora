/**
 * FormAssuranceVie
 * Étape 11.1 — Module Assurance Vie | Fondora
 *
 * Formulaire multi-onglets pour créer/gérer un contrat AV :
 *   Onglet 1 — Contrat     : nom, assureur, date ouverture, frais enveloppe
 *   Onglet 2 — Versements  : ajout d'un versement (date + montant)
 *   Onglet 3 — Valorisation: saisie de la valeur Fonds Euros du jour
 *   Onglet 4 — UC          : recherche dans catalogue_actifs + nb_parts
 *
 * Props :
 *   contrat         {Object|null}  — Contrat existant (null = création)
 *   onAjouterContrat    {Function}
 *   onAjouterVersement  {Function}
 *   onUpsertValorisation {Function}
 *   onUpsertPositionUC  {Function}
 *   onClose         {Function}     — Ferme le formulaire
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ONGLETS = [
    { id: 'contrat', label: 'Contrat' },
    { id: 'versement', label: 'Versement' },
    { id: 'valorisation', label: 'Fonds Euros' },
    { id: 'uc', label: 'Unités de Compte' },
]

const today = () => new Date().toISOString().split('T')[0]

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FormAssuranceVie({
    contrat = null,
    onAjouterContrat,
    onAjouterVersement,
    onUpsertValorisation,
    onUpsertPositionUC,
    onClose,
}) {
    const modeCreation = contrat === null
    const [onglet, setOnglet] = useState(modeCreation ? 'contrat' : 'versement')
    const [submitting, setSubmitting] = useState(false)
    const [erreur, setErreur] = useState(null)
    const [succes, setSucces] = useState(null)

    // ── État Onglet 1 : Contrat ───────────────────────────────────────────────
    const [formContrat, setFormContrat] = useState({
        nom: '',
        assureur: '',
        date_ouverture: today(),
        frais_gestion_enveloppe: '0.60',
    })

    // ── État Onglet 2 : Versement ─────────────────────────────────────────────
    const [formVersement, setFormVersement] = useState({
        date: today(),
        montant: '',
    })

    // ── État Onglet 3 : Valorisation ──────────────────────────────────────────
    const [formValorisation, setFormValorisation] = useState({
        date: today(),
        valeur: '',
    })

    // ── État Onglet 4 : UC ────────────────────────────────────────────────────
    const [rechercheUC, setRechercheUC] = useState('')
    const [resultatsUC, setResultatsUC] = useState([])
    const [actifSelectionne, setActifSelectionne] = useState(null)
    const [formUC, setFormUC] = useState({ nb_parts: '' })

    // ── Recherche dans catalogue_actifs ───────────────────────────────────────
    const rechercherUC = useCallback(async (terme) => {
        if (terme.length < 2) {
            setResultatsUC([])
            return
        }
        const { data } = await supabase
            .from('catalogue_actifs')
            .select('id, nom, isin, frais_ter_produit, type_actif')
            .or(`nom.ilike.%${terme}%,isin.ilike.%${terme}%`)
            .limit(8)
        setResultatsUC(data || [])
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => rechercherUC(rechercheUC), 300)
        return () => clearTimeout(timer)
    }, [rechercheUC, rechercherUC])

    // ── Helpers UI ────────────────────────────────────────────────────────────

    const afficherSucces = (msg) => {
        setSucces(msg)
        setErreur(null)
        setTimeout(() => setSucces(null), 3000)
    }

    const afficherErreur = (msg) => {
        setErreur(msg)
        setSucces(null)
    }

    // ── Soumissions ───────────────────────────────────────────────────────────

    const handleSoumettreContrat = async (e) => {
        e.preventDefault()
        if (!formContrat.nom || !formContrat.assureur || !formContrat.date_ouverture) {
            afficherErreur('Veuillez remplir tous les champs obligatoires.')
            return
        }
        setSubmitting(true)
        try {
            await onAjouterContrat({
                nom: formContrat.nom.trim(),
                assureur: formContrat.assureur.trim(),
                date_ouverture: formContrat.date_ouverture,
                frais_gestion_enveloppe: parseFloat(formContrat.frais_gestion_enveloppe) || 0.60,
            })
            afficherSucces('Contrat créé avec succès.')
            setTimeout(() => onClose?.(), 1500)
        } catch (err) {
            afficherErreur(err.message || 'Erreur lors de la création du contrat.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSoumettreVersement = async (e) => {
        e.preventDefault()
        if (!formVersement.date || !formVersement.montant) {
            afficherErreur('Veuillez renseigner la date et le montant.')
            return
        }
        setSubmitting(true)
        try {
            await onAjouterVersement(contrat.id, {
                date: formVersement.date,
                montant: parseFloat(formVersement.montant),
            })
            afficherSucces('Versement enregistré.')
            setFormVersement({ date: today(), montant: '' })
        } catch (err) {
            afficherErreur(err.message || 'Erreur lors de l\'enregistrement du versement.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSoumettreValorisation = async (e) => {
        e.preventDefault()
        if (!formValorisation.date || !formValorisation.valeur) {
            afficherErreur('Veuillez renseigner la date et la valeur.')
            return
        }
        setSubmitting(true)
        try {
            await onUpsertValorisation(contrat.id, {
                date: formValorisation.date,
                valeur: parseFloat(formValorisation.valeur),
            })
            afficherSucces('Valorisation mise à jour.')
        } catch (err) {
            afficherErreur(err.message || 'Erreur lors de la mise à jour de la valorisation.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSoumettreUC = async (e) => {
        e.preventDefault()
        if (!actifSelectionne || !formUC.nb_parts) {
            afficherErreur('Sélectionnez un actif et renseignez le nombre de parts.')
            return
        }
        setSubmitting(true)
        try {
            await onUpsertPositionUC(contrat.id, {
                asset_id: actifSelectionne.id,
                isin: actifSelectionne.isin,
                nb_parts: parseFloat(formUC.nb_parts),
            })
            afficherSucces(`Position UC "${actifSelectionne.nom}" mise à jour.`)
            setActifSelectionne(null)
            setRechercheUC('')
            setFormUC({ nb_parts: '' })
        } catch (err) {
            afficherErreur(err.message || 'Erreur lors de la mise à jour de la position UC.')
        } finally {
            setSubmitting(false)
        }
    }

    // ─── Styles ───────────────────────────────────────────────────────────────

    const s = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        },
        modal: {
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '24px 24px 0', marginBottom: '20px',
        },
        titre: { color: '#f1f5f9', fontSize: '18px', fontWeight: 700, margin: 0 },
        btnFermer: {
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px',
        },
        onglets: {
            display: 'flex', gap: '4px',
            padding: '0 24px', marginBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        },
        ongletBtn: (actif) => ({
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 14px',
            color: actif ? '#6366f1' : '#64748b',
            fontSize: '13px', fontWeight: actif ? 700 : 500,
            borderBottom: actif ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.2s',
        }),
        body: { padding: '0 24px 24px' },
        label: { display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '6px' },
        input: {
            width: '100%', padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: '#f1f5f9', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box',
        },
        fieldGroup: { marginBottom: '16px' },
        btnPrimary: {
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', marginTop: '8px',
            opacity: submitting ? 0.6 : 1,
        },
        alerte: (type) => ({
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px',
            background: type === 'succes' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${type === 'succes' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: type === 'succes' ? '#34d399' : '#f87171',
        }),
        resultatsUCListe: {
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', marginTop: '4px', overflow: 'hidden',
        },
        resultatsUCItem: {
            padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
        },
        badgeActive: {
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px', marginBottom: '12px',
        },
    }

    // ─── Rendu ────────────────────────────────────────────────────────────────

    const titreModal = modeCreation
        ? 'Nouveau contrat AV'
        : `${contrat.nom} — ${contrat.assureur}`

    return (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div style={s.modal}>
                {/* Header */}
                <div style={s.header}>
                    <h2 style={s.titre}>{titreModal}</h2>
                    <button style={s.btnFermer} onClick={onClose} aria-label="Fermer">✕</button>
                </div>

                {/* Onglets — masqués en mode création (seul "Contrat" visible) */}
                {!modeCreation && (
                    <div style={s.onglets}>
                        {ONGLETS.filter((o) => o.id !== 'contrat').map((o) => (
                            <button
                                key={o.id}
                                style={s.ongletBtn(onglet === o.id)}
                                onClick={() => setOnglet(o.id)}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}

                <div style={s.body}>
                    {/* Alertes */}
                    {erreur && <div style={s.alerte('erreur')}>{erreur}</div>}
                    {succes && <div style={s.alerte('succes')}>✓ {succes}</div>}

                    {/* ── Onglet : Contrat ─────────────────────────────────────── */}
                    {(modeCreation || onglet === 'contrat') && (
                        <form onSubmit={handleSoumettreContrat}>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="av-nom">Nom du contrat *</label>
                                <input
                                    id="av-nom"
                                    style={s.input}
                                    value={formContrat.nom}
                                    onChange={(e) => setFormContrat({ ...formContrat, nom: e.target.value })}
                                    placeholder="Ex : Retraite Boursorama"
                                    required
                                />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="av-assureur">Assureur *</label>
                                <input
                                    id="av-assureur"
                                    style={s.input}
                                    value={formContrat.assureur}
                                    onChange={(e) => setFormContrat({ ...formContrat, assureur: e.target.value })}
                                    placeholder="Ex : Spirica, Generali, Swiss Life…"
                                    required
                                />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="av-date">Date d'ouverture *</label>
                                <input
                                    id="av-date"
                                    type="date"
                                    style={s.input}
                                    value={formContrat.date_ouverture}
                                    onChange={(e) => setFormContrat({ ...formContrat, date_ouverture: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="av-frais">
                                    Frais de gestion enveloppe (%/an)
                                </label>
                                <input
                                    id="av-frais"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    style={s.input}
                                    value={formContrat.frais_gestion_enveloppe}
                                    onChange={(e) =>
                                        setFormContrat({ ...formContrat, frais_gestion_enveloppe: e.target.value })
                                    }
                                />
                                {parseFloat(formContrat.frais_gestion_enveloppe) > 1.00 && (
                                    <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ Attention, ce contrat présente des frais d'enveloppe très élevés.</p>
                                )}
                            </div>
                            <button style={s.btnPrimary} type="submit" disabled={submitting}>
                                {submitting ? 'Création…' : 'Créer le contrat'}
                            </button>
                        </form>
                    )}

                    {/* ── Onglet : Versement ───────────────────────────────────── */}
                    {!modeCreation && onglet === 'versement' && (
                        <form onSubmit={handleSoumettreVersement}>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="v-date">Date du versement *</label>
                                <input
                                    id="v-date"
                                    type="date"
                                    style={s.input}
                                    value={formVersement.date}
                                    onChange={(e) => setFormVersement({ ...formVersement, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="v-montant">Montant (€) *</label>
                                <input
                                    id="v-montant"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    style={s.input}
                                    value={formVersement.montant}
                                    onChange={(e) => setFormVersement({ ...formVersement, montant: e.target.value })}
                                    placeholder="Ex : 1000"
                                    required
                                />
                            </div>
                            <button style={s.btnPrimary} type="submit" disabled={submitting}>
                                {submitting ? 'Enregistrement…' : 'Enregistrer le versement'}
                            </button>
                        </form>
                    )}

                    {/* ── Onglet : Valorisation Fonds Euros ───────────────────── */}
                    {!modeCreation && onglet === 'valorisation' && (
                        <form onSubmit={handleSoumettreValorisation}>
                            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0 }}>
                                Saisissez la valeur actuelle du compartiment Fonds Euros de votre contrat.
                                Si une valorisation existe déjà pour cette date, elle sera mise à jour.
                            </p>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="val-date">Date *</label>
                                <input
                                    id="val-date"
                                    type="date"
                                    style={s.input}
                                    value={formValorisation.date}
                                    onChange={(e) => setFormValorisation({ ...formValorisation, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="val-valeur">Valeur Fonds Euros (€) *</label>
                                <input
                                    id="val-valeur"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    style={s.input}
                                    value={formValorisation.valeur}
                                    onChange={(e) => setFormValorisation({ ...formValorisation, valeur: e.target.value })}
                                    placeholder="Ex : 12500"
                                    required
                                />
                            </div>
                            <button style={s.btnPrimary} type="submit" disabled={submitting}>
                                {submitting ? 'Mise à jour…' : 'Mettre à jour la valorisation'}
                            </button>
                        </form>
                    )}

                    {/* ── Onglet : Unités de Compte ────────────────────────────── */}
                    {!modeCreation && onglet === 'uc' && (
                        <form onSubmit={handleSoumettreUC}>
                            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0 }}>
                                Recherchez un actif dans le catalogue (ISIN, nom de fonds) et renseignez
                                votre nombre de parts. Si cette UC existe déjà, la position sera mise à jour.
                            </p>

                            {/* Actif sélectionné */}
                            {actifSelectionne ? (
                                <div style={s.badgeActive}>
                                    <span style={{ color: '#6366f1', fontSize: '13px', fontWeight: 700 }}>
                                        {actifSelectionne.nom}
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                                        {actifSelectionne.isin}
                                    </span>
                                    {actifSelectionne.frais_ter_produit != null && (
                                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                                            TER {actifSelectionne.frais_ter_produit} %
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setActifSelectionne(null)}
                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={s.fieldGroup}>
                                    <label style={s.label} htmlFor="uc-recherche">
                                        Rechercher dans le catalogue *
                                    </label>
                                    <input
                                        id="uc-recherche"
                                        style={s.input}
                                        value={rechercheUC}
                                        onChange={(e) => setRechercheUC(e.target.value)}
                                        placeholder="Nom, ISIN… (min. 2 caractères)"
                                        autoComplete="off"
                                    />
                                    {resultatsUC.length > 0 && (
                                        <div style={s.resultatsUCListe}>
                                            {resultatsUC.map((actif) => (
                                                <div
                                                    key={actif.id}
                                                    style={s.resultatsUCItem}
                                                    onClick={() => {
                                                        setActifSelectionne(actif)
                                                        setRechercheUC('')
                                                        setResultatsUC([])
                                                    }}
                                                >
                                                    <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>
                                                        {actif.nom}
                                                    </span>
                                                    <br />
                                                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                        {actif.isin}
                                                        {actif.frais_ter_produit != null
                                                            ? ` • TER ${actif.frais_ter_produit} %`
                                                            : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={s.fieldGroup}>
                                <label style={s.label} htmlFor="uc-parts">Nombre de parts *</label>
                                <input
                                    id="uc-parts"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    style={s.input}
                                    value={formUC.nb_parts}
                                    onChange={(e) => setFormUC({ ...formUC, nb_parts: e.target.value })}
                                    placeholder="Ex : 42.5000"
                                    required
                                />
                            </div>
                            <button
                                style={s.btnPrimary}
                                type="submit"
                                disabled={submitting || !actifSelectionne}
                            >
                                {submitting ? 'Enregistrement…' : 'Enregistrer la position UC'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
