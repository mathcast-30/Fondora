/**
 * AssuranceVieCard
 * Étape 11.1 — Module Assurance Vie | Fondora
 *
 * Carte résumant un contrat AV avec :
 *   - Valeur actuelle (masquée en mode incognito)
 *   - Performance en € et %
 *   - XIRR, frais cumulés, alerte frais élevés
 *   - Simulateur fiscal (rachat partiel)
 *   - Graphique manque à gagner (ouvert sur clic)
 *   - Boutons d'action : ajouter versement / UC / valorisation / supprimer
 *
 * Props :
 *   metriques       {Object}    — Retour de useAssurancesVie().metriquesContrat(id)
 *   isIncognito     {boolean}   — Masque les valeurs monétaires
 *   situationFamiliale {string} — 'marie' | autre (depuis profile AuthContext)
 *   onOuvrirForm    {Function}  — Ouvre FormAssuranceVie avec le contrat
 *   onSupprimer     {Function}  — Déclenche supprimerContrat
 */

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, Trash2, Settings } from 'lucide-react'
import { calculerFiscaliteAV, formatCurrency } from '../../lib/financialCalculations'
import GraphiqueFraisComparatif from './GraphiqueFraisComparatif'

// ─── Helper d'affichage masqué (incognito) ────────────────────────────────────

const MASQUE = '••••••'
const aff = (val, incognito, formatter = formatCurrency) =>
    incognito ? MASQUE : formatter(val)

// ─── Sous-composant : badge de performance ────────────────────────────────────

function BadgePerf({ euros, pourcentage, incognito }) {
    const positif = euros >= 0
    const couleur = positif ? '#34d399' : '#f87171'
    const signe = positif ? '+' : ''

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: positif ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${positif ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                borderRadius: '8px',
                padding: '4px 10px',
            }}
        >
            {positif ? <TrendingUp size={13} color={couleur} /> : <TrendingDown size={13} color={couleur} />}
            <span style={{ color: couleur, fontSize: '13px', fontWeight: 700 }}>
                {incognito
                    ? MASQUE
                    : `${signe}${formatCurrency(euros)} (${signe}${pourcentage.toFixed(2)} %)`}
            </span>
        </div>
    )
}

// ─── Sous-composant : simulateur fiscal ──────────────────────────────────────

function SimulateurFiscal({ metriques, situationFamiliale, incognito }) {
    const [montantRetrait, setMontantRetrait] = useState('')

    const fiscal = useMemo(() => {
        const montant = Number.parseFloat(montantRetrait) || 0
        if (!montant || montant <= 0) return null
        return calculerFiscaliteAV(
            montant,
            metriques.versementsTotaux,
            metriques.valeurActuelle,
            metriques.contrat.date_ouverture,
            situationFamiliale
        )
    }, [montantRetrait, metriques, situationFamiliale])

    const s = {
        container: {
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.07)',
        },
        label: { color: '#64748b', fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block' },
        input: {
            width: '100%', padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: '#f1f5f9', fontSize: '13px', outline: 'none',
            boxSizing: 'border-box',
        },
        row: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '6px 0' },
        key: { color: '#64748b' },
        val: (color = '#f1f5f9') => ({ color, fontWeight: 600 }),
    }

    return (
        <div style={s.container}>
            <label style={s.label} htmlFor={`sim-${metriques.contrat.id}`}>
                🔢 Simulateur fiscal — Rachat partiel
            </label>
            <input
                id={`sim-${metriques.contrat.id}`}
                type="number"
                min="0"
                step="100"
                style={s.input}
                value={montantRetrait}
                onChange={(e) => setMontantRetrait(e.target.value)}
                placeholder="Montant hypothétique à retirer (€)"
            />
            {fiscal && (
                <div style={{ marginTop: '12px' }}>
                    <div style={s.row}>
                        <span style={s.key}>Régime fiscal</span>
                        <span style={s.val('#a78bfa')}>
                            {fiscal.regimeFiscal === 'PFU'
                                ? `PFU 30 % (< 8 ans)`
                                : `Régime AV 8 ans`}
                        </span>
                    </div>
                    {fiscal.anneesAvantOptimum && (
                        <div style={s.row}>
                            <span style={s.key}>Avant abattement</span>
                            <span style={s.val('#fbbf24')}>
                                {fiscal.anneesAvantOptimum} an{fiscal.anneesAvantOptimum > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    <div style={s.row}>
                        <span style={s.key}>Quote-part gains</span>
                        <span style={s.val()}>{aff(fiscal.quotePart, incognito)}</span>
                    </div>
                    {fiscal.abattement > 0 && (
                        <div style={s.row}>
                            <span style={s.key}>Abattement</span>
                            <span style={s.val('#34d399')}>− {formatCurrency(fiscal.abattement)}</span>
                        </div>
                    )}
                    <div style={s.row}>
                        <span style={s.key}>Impôt revenu</span>
                        <span style={s.val('#f87171')}>{aff(fiscal.impotRevenu, incognito)}</span>
                    </div>
                    <div style={s.row}>
                        <span style={s.key}>Prél. sociaux (17,2 %)</span>
                        <span style={s.val('#f87171')}>{aff(fiscal.prelevementsSociaux, incognito)}</span>
                    </div>
                    <div
                        style={{
                            ...s.row,
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            marginTop: '8px',
                        }}
                    >
                        <span style={{ ...s.key, fontWeight: 700, color: '#94a3b8' }}>Total fiscalité</span>
                        <span style={s.val('#f87171')}>
                            {aff(fiscal.impotTotal, incognito)}{' '}
                            {!incognito && <span style={{ color: '#64748b', fontWeight: 400 }}>
                                ({fiscal.tauxEffectif.toFixed(1)} % eff.)
                            </span>}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AssuranceVieCard({ metriques, isIncognito, situationFamiliale, onOuvrirForm, onSupprimer }) {
    const [graphiqueOuvert, setGraphiqueOuvert] = useState(false)
    const [fiscalOuvert, setFiscalOuvert] = useState(false)
    const [confirmSuppression, setConfirmSuppression] = useState(false)

    const {
        contrat,
        valeurActuelle,
        versementsTotaux,
        perfEuros,
        perfPct,
        xirr,
        fraisTotalPct,
        fraisAnnuelsEuros,
        alerteFreisEleves,
        fraisTerMoyen,
        derniereDateValorisation,
        ucDisponibles,
        positionsUC,
    } = metriques

    const fraisEnveloppe = contrat.frais_gestion_enveloppe

    const s = {
        card: {
            background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.2s',
        },
        row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
        col: { display: 'flex', flexDirection: 'column', gap: '4px' },
        assureur: { color: '#64748b', fontSize: '12px', fontWeight: 500 },
        nom: { color: '#f1f5f9', fontSize: '18px', fontWeight: 700 },
        valeur: { color: '#f1f5f9', fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' },
        metaRow: {
            display: 'flex', gap: '16px', flexWrap: 'wrap',
            marginTop: '16px', paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
        },
        metaItem: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' },
        metaLabel: { color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
        metaValue: (color = '#94a3b8') => ({ color, fontSize: '14px', fontWeight: 700 }),
        actions: { display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' },
        btnAction: (color = '#6366f1') => ({
            padding: '7px 14px',
            background: `rgba(${color === '#6366f1' ? '99,102,241' : color === '#f87171' ? '248,113,113' : '100,116,139'}, 0.1)`,
            border: `1px solid rgba(${color === '#6366f1' ? '99,102,241' : color === '#f87171' ? '248,113,113' : '100,116,139'}, 0.25)`,
            borderRadius: '8px', color, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }),
        btnToggle: {
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: '12px', fontWeight: 600, padding: 0,
        },
    }

    return (
        <div style={s.card}>
            {/* Header : nom + valeur */}
            <div style={s.row}>
                <div style={s.col}>
                    <span style={s.assureur}>{contrat.assureur}</span>
                    <span style={s.nom}>{contrat.nom}</span>
                    <span style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                        Ouvert le {new Date(contrat.date_ouverture).toLocaleDateString('fr-FR')}
                        {derniereDateValorisation
                            ? ` · MàJ ${new Date(derniereDateValorisation).toLocaleDateString('fr-FR')}`
                            : ''}
                    </span>
                </div>
                <div style={{ ...s.col, alignItems: 'flex-end', gap: '8px' }}>
                    <span style={s.valeur}>{aff(valeurActuelle, isIncognito)}</span>
                    {!ucDisponibles && (
                        <span style={{ color: '#fbbf24', fontSize: '11px' }}>
                            ⚠ Prix UC partiellement indisponibles
                        </span>
                    )}
                </div>
            </div>

            {/* Performance */}
            <div style={{ marginTop: '12px' }}>
                <BadgePerf euros={perfEuros} pourcentage={perfPct} incognito={isIncognito} />
            </div>

            {/* Métriques secondaires */}
            <div style={s.metaRow}>
                <div style={s.metaItem}>
                    <span style={s.metaLabel}>Versements</span>
                    <span style={s.metaValue()}>{aff(versementsTotaux, isIncognito)}</span>
                </div>
                <div style={s.metaItem}>
                    <span style={s.metaLabel}>XIRR</span>
                    <span style={s.metaValue(xirr >= 0 ? '#34d399' : '#f87171')}>
                        {isIncognito
                            ? MASQUE
                            : xirr != null
                            ? `${(xirr * 100).toFixed(2)} %`
                            : 'N/A'}
                    </span>
                </div>
                <div style={s.metaItem}>
                    <span style={s.metaLabel}>Frais totaux</span>
                    <span style={s.metaValue(alerteFreisEleves ? '#f87171' : '#94a3b8')}>
                        {fraisTotalPct.toFixed(2)} %
                        {alerteFreisEleves && (
                            <AlertTriangle
                                size={12}
                                style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }}
                                color="#f87171"
                            />
                        )}
                    </span>
                </div>
                <div style={s.metaItem}>
                    <span style={s.metaLabel}>Frais/an</span>
                    <span style={s.metaValue('#f87171')}>− {aff(fraisAnnuelsEuros, isIncognito)}</span>
                </div>
                {positionsUC.length > 0 && (
                    <div style={s.metaItem}>
                        <span style={s.metaLabel}>UC</span>
                        <span style={s.metaValue()}>
                            {positionsUC.length} ligne{positionsUC.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Boutons d'action */}
            <div style={s.actions}>
                <button style={s.btnAction('#6366f1')} onClick={() => onOuvrirForm?.(contrat)}>
                    <Settings size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Gérer
                </button>
                <button
                    style={s.btnToggle}
                    onClick={() => setFiscalOuvert((v) => !v)}
                >
                    Fiscal {fiscalOuvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button
                    style={s.btnToggle}
                    onClick={() => setGraphiqueOuvert((v) => !v)}
                >
                    Frais {graphiqueOuvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {confirmSuppression ? (
                    <>
                        <span style={{ color: '#f87171', fontSize: '12px', alignSelf: 'center' }}>
                            Confirmer la suppression ?
                        </span>
                        <button
                            style={s.btnAction('#f87171')}
                            onClick={() => { onSupprimer?.(contrat.id); setConfirmSuppression(false) }}
                        >
                            Oui, supprimer
                        </button>
                        <button
                            style={s.btnAction('#64748b')}
                            onClick={() => setConfirmSuppression(false)}
                        >
                            Annuler
                        </button>
                    </>
                ) : (
                    <button
                        style={{ ...s.btnToggle, marginLeft: 'auto' }}
                        onClick={() => setConfirmSuppression(true)}
                    >
                        <Trash2 size={13} color="#f87171" />
                    </button>
                )}
            </div>

            {/* Simulateur fiscal (repliable) */}
            {fiscalOuvert && (
                <SimulateurFiscal
                    metriques={metriques}
                    situationFamiliale={situationFamiliale}
                    incognito={isIncognito}
                />
            )}

            {/* Graphique manque à gagner (repliable) */}
            {graphiqueOuvert && (
                <div style={{ marginTop: '20px' }}>
                    <GraphiqueFraisComparatif
                        valeurActuelle={valeurActuelle}
                        fraisEnveloppe={fraisEnveloppe}
                        fraisTerMoyen={fraisTerMoyen}
                    />
                </div>
            )}
        </div>
    )
}
