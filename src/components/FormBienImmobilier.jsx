// src/components/FormBienImmobilier.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TYPES_BIENS = ['Appartement', 'Maison', 'Studio', 'Immeuble', 'Local commercial', 'Terrain', 'Autre']
const STATUTS = ['Résidence principale', 'Résidence secondaire', 'Investissement locatif', 'SCPI', 'Autre']

const FORM_INITIAL = {
    nom: '', adresse: '', type_bien: 'Appartement', statut: 'Résidence principale',
    prix_achat: '', valeur_actuelle: '', date_achat: '',
    assurance_emprunteur_annuelle: '', taxe_fonciere_annuelle: '',
    charges_copropriete_annuelle: '', assurance_habitation_annuelle: '',
    frais_gestion_annuelle: '', travaux_annuels: '',
    loyer_mensuel: '', taux_vacance: '0',
}

const CREDIT_INITIAL = {
    active: false,
    nom: '',
    capital_emprunte: '',
    taux_interet: '',
    duree_mois: '',
    date_debut: new Date().toISOString().split('T')[0],
}

function calculerMensualite(capital, taux, duree) {
    if (!capital || !taux || !duree) return 0
    const c = parseFloat(capital)
    const t = parseFloat(taux) / 100 / 12
    const n = parseInt(duree)
    if (c <= 0 || n <= 0) return 0
    if (t === 0) return c / n
    return (c * t * Math.pow(1 + t, n)) / (Math.pow(1 + t, n) - 1)
}

function FormBienImmobilier({ onSubmit, onAnnuler }) {
    const [form, setForm] = useState(FORM_INITIAL)
    const [etape, setEtape] = useState(1)
    const [credit, setCredit] = useState(CREDIT_INITIAL)

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
    const setC = (key, val) => setCredit((c) => ({ ...c, [key]: val }))

    const mensualiteCalculee = calculerMensualite(
        credit.capital_emprunte,
        credit.taux_interet,
        credit.duree_mois
    )

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Construction des données du bien (sans champs legacy crédit)
        const donnees = {}
        Object.keys(FORM_INITIAL).forEach((key) => {
            const val = form[key]
            if (val === '' || val === null) {
                donnees[key] = 0
            } else if (typeof val === 'string' && !isNaN(val) && val !== '') {
                donnees[key] = parseFloat(val)
            } else {
                donnees[key] = val
            }
        })

        // On passe montant_credit = 0 pour ne pas polluer les champs legacy
        donnees.montant_credit = 0
        donnees.mensualite_credit = 0

        // 1. Créer le bien immobilier
        const bienCree = await onSubmit(donnees)

        // 2. Créer le crédit dans la table `dettes` si activé
        if (
            credit.active &&
            credit.capital_emprunte &&
            credit.taux_interet &&
            credit.duree_mois &&
            credit.date_debut &&
            mensualiteCalculee > 0 &&
            bienCree?.id
        ) {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('dettes').insert([{
                user_id: user.id,
                nom: credit.nom || `Crédit — ${donnees.nom}`,
                type: 'Immobilier',
                bien_immobilier_id: bienCree.id,
                capital_emprunte: parseFloat(credit.capital_emprunte),
                taux_interet: parseFloat(credit.taux_interet),
                duree_mois: parseInt(credit.duree_mois),
                mensualite: Math.round(mensualiteCalculee * 100) / 100,
                date_debut: credit.date_debut,
                rembourse_automatiquement: true,
            }])
        }
    }

    const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm'
    const labelClass = 'text-xs text-gray-500 mb-1 block'

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Navigation étapes */}
            <div className="flex gap-1 mb-2">
                {['Général', 'Crédit', 'Charges', 'Locatif'].map((label, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setEtape(i + 1)}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition ${etape === i + 1 ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Étape 1 : Général ── */}
            {etape === 1 && (
                <div className="space-y-3">
                    <div>
                        <label className={labelClass}>Nom du bien *</label>
                        <input required type="text" value={form.nom}
                            onChange={(e) => set('nom', e.target.value)}
                            placeholder="Ex: Appartement Paris 11e" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Adresse</label>
                        <input type="text" value={form.adresse}
                            onChange={(e) => set('adresse', e.target.value)}
                            placeholder="Ex: 15 rue de la Paix, Paris" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={labelClass}>Type de bien</label>
                            <select value={form.type_bien}
                                onChange={(e) => set('type_bien', e.target.value)}
                                className={inputClass}>
                                {TYPES_BIENS.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Statut</label>
                            <select value={form.statut}
                                onChange={(e) => set('statut', e.target.value)}
                                className={inputClass}>
                                {STATUTS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={labelClass}>Prix d'achat (€) *</label>
                            <input required type="number" step="1" value={form.prix_achat}
                                onChange={(e) => set('prix_achat', e.target.value)}
                                placeholder="250000" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Valeur actuelle (€) *</label>
                            <input required type="number" step="1" value={form.valeur_actuelle}
                                onChange={(e) => set('valeur_actuelle', e.target.value)}
                                placeholder="270000" className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Date d'achat</label>
                        <input type="date" value={form.date_achat}
                            onChange={(e) => set('date_achat', e.target.value)}
                            className={inputClass} />
                    </div>
                </div>
            )}

            {/* ── Étape 2 : Crédit (alimente la table `dettes`) ── */}
            {etape === 2 && (
                <div className="space-y-3">
                    {/* Checkbox d'activation */}
                    <div style={{
                        background: '#F0FDF4',
                        border: '1px solid #D1FAE5',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                    }}>
                        <input
                            type="checkbox"
                            id="credit_active"
                            checked={credit.active}
                            onChange={(e) => setC('active', e.target.checked)}
                            style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }}
                        />
                        <label htmlFor="credit_active" style={{ fontSize: 13, cursor: 'pointer' }}>
                            <strong style={{ color: '#065F46' }}>Ce bien est financé par un crédit</strong><br />
                            <span style={{ fontWeight: 400, color: '#6B7280' }}>
                                Crée automatiquement un crédit dans Passifs &amp; Dettes, lié à ce bien.
                            </span>
                        </label>
                    </div>

                    {credit.active && (
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>Nom du crédit</label>
                                <input
                                    type="text"
                                    value={credit.nom}
                                    onChange={(e) => setC('nom', e.target.value)}
                                    placeholder={`Crédit — ${form.nom || 'mon bien'}`}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Capital emprunté (€) *</label>
                                <input type="number" step="1" placeholder="200000"
                                    value={credit.capital_emprunte}
                                    onChange={(e) => setC('capital_emprunte', e.target.value)}
                                    className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={labelClass}>Taux d'intérêt (%) *</label>
                                    <input type="number" step="0.001" placeholder="3.5"
                                        value={credit.taux_interet}
                                        onChange={(e) => setC('taux_interet', e.target.value)}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Durée (mois) *</label>
                                    <input type="number" step="1" placeholder="240"
                                        value={credit.duree_mois}
                                        onChange={(e) => setC('duree_mois', e.target.value)}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Date de 1ère échéance *</label>
                                <input type="date"
                                    value={credit.date_debut}
                                    onChange={(e) => setC('date_debut', e.target.value)}
                                    className={inputClass} />
                            </div>
                            {mensualiteCalculee > 0 && (
                                <div className="bg-emerald/10 rounded-lg p-3 text-sm text-emerald font-medium">
                                    💡 Mensualité calculée :{' '}
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mensualiteCalculee)}/mois
                                </div>
                            )}
                        </div>
                    )}

                    {!credit.active && (
                        <p className="text-xs text-gray-400 text-center py-4">
                            Coche la case ci-dessus si ce bien est financé par un emprunt.
                        </p>
                    )}
                </div>
            )}

            {/* ── Étape 3 : Charges ── */}
            {etape === 3 && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-400">Montants annuels (laisse vide si non applicable).</p>
                    {[
                        ['assurance_emprunteur_annuelle', "Assurance emprunteur (€/an)"],
                        ['taxe_fonciere_annuelle', "Taxe foncière (€/an)"],
                        ['charges_copropriete_annuelle', "Charges de copropriété (€/an)"],
                        ['assurance_habitation_annuelle', "Assurance habitation (€/an)"],
                        ['frais_gestion_annuelle', "Frais de gestion locative (€/an)"],
                        ['travaux_annuels', "Budget travaux (€/an)"],
                    ].map(([key, label]) => (
                        <div key={key}>
                            <label className={labelClass}>{label}</label>
                            <input type="number" step="1" value={form[key]}
                                onChange={(e) => set(key, e.target.value)}
                                placeholder="0" className={inputClass} />
                        </div>
                    ))}
                </div>
            )}

            {/* ── Étape 4 : Locatif ── */}
            {etape === 4 && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-400">Laisse vide si résidence principale.</p>
                    <div>
                        <label className={labelClass}>Loyer mensuel perçu (€)</label>
                        <input type="number" step="1" value={form.loyer_mensuel}
                            onChange={(e) => set('loyer_mensuel', e.target.value)}
                            placeholder="800" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Taux de vacance locative (%)</label>
                        <input type="number" step="0.1" value={form.taux_vacance}
                            onChange={(e) => set('taux_vacance', e.target.value)}
                            placeholder="8" className={inputClass} />
                        <p className="text-xs text-gray-400 mt-1">Ex: 8% = environ 1 mois vide par an</p>
                    </div>
                </div>
            )}

            {/* ── Boutons navigation ── */}
            <div className="flex gap-2 pt-2">
                {etape > 1 && (
                    <button type="button" onClick={() => setEtape(etape - 1)}
                        className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm">
                        Précédent
                    </button>
                )}
                {etape < 4 ? (
                    <button type="button" onClick={() => setEtape(etape + 1)}
                        className="flex-1 bg-navy text-white py-2 rounded-lg text-sm font-medium">
                        Suivant
                    </button>
                ) : (
                    <button type="submit"
                        className="flex-1 bg-emerald hover:bg-emerald-light text-white py-2 rounded-lg text-sm font-semibold">
                        Ajouter le bien
                    </button>
                )}
            </div>
        </form>
    )
}

export default FormBienImmobilier