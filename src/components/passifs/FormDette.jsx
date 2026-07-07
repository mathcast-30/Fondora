// src/components/passifs/FormDette.jsx
import { useState, useEffect } from 'react';

const TYPES_DETTE = ['Consommation', 'Immobilier', 'Automobile', 'Dette Privée', 'Fiscale', 'Autre'];

const FORM_VIDE = {
    nom: '',
    type: 'Consommation',
    bien_immobilier_id: null,
    capital_emprunte: '',
    taux_interet: '',
    duree_mois: '',
    mensualite: '',
    date_debut: new Date().toISOString().split('T')[0],
    rembourse_automatiquement: true,
    notes: '',
};

function calculerMensualiteAuto(capital, taux, duree) {
    if (!capital || !taux || !duree) return null;
    const c = parseFloat(capital);
    const t = parseFloat(taux) / 100 / 12;
    const n = parseInt(duree);
    if (c <= 0 || t < 0 || n <= 0) return null;
    if (t === 0) return c / n;
    return (c * t * Math.pow(1 + t, n)) / (Math.pow(1 + t, n) - 1);
}

export function FormDette({ ouvert, onClose, onSubmit, detteInitiale, biensImmobiliers }) {
    const [form, setForm] = useState(FORM_VIDE);
    const [erreurs, setErreurs] = useState({});
    const [loading, setLoading] = useState(false);

    // Pré-remplissage en mode édition
    useEffect(() => {
        if (ouvert && detteInitiale) {
            setForm({
                nom: detteInitiale.nom || '',
                type: detteInitiale.type || 'Consommation',
                bien_immobilier_id: detteInitiale.bien_immobilier_id || null,
                capital_emprunte: String(detteInitiale.capital_emprunte || ''),
                taux_interet: String(detteInitiale.taux_interet || ''),
                duree_mois: String(detteInitiale.duree_mois || ''),
                mensualite: String(detteInitiale.mensualite || ''),
                date_debut: detteInitiale.date_debut || new Date().toISOString().split('T')[0],
                rembourse_automatiquement: detteInitiale.rembourse_automatiquement ?? true,
                notes: detteInitiale.notes || '',
            });
        } else if (ouvert && !detteInitiale) {
            setForm(FORM_VIDE);
        }
        setErreurs({});
    }, [ouvert, detteInitiale]);

    // Fermeture avec Escape
    useEffect(() => {
        if (!ouvert) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [ouvert, onClose]);

    if (!ouvert) return null;

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    // Mensualité calculée automatiquement
    const mensualiteCalc = calculerMensualiteAuto(form.capital_emprunte, form.taux_interet, form.duree_mois);

    // Validation
    const valider = () => {
        const e = {};
        if (!form.nom.trim()) e.nom = 'Le nom est obligatoire.';
        if (!form.capital_emprunte || parseFloat(form.capital_emprunte) <= 0)
            e.capital_emprunte = 'Le capital doit être > 0.';
        if (form.taux_interet === '' || parseFloat(form.taux_interet) < 0)
            e.taux_interet = 'Le taux doit être >= 0.';
        if (!form.duree_mois || parseInt(form.duree_mois) <= 0 || !Number.isInteger(parseFloat(form.duree_mois)))
            e.duree_mois = 'La durée doit être un entier > 0.';
        if (!form.mensualite || parseFloat(form.mensualite) <= 0)
            e.mensualite = 'La mensualité doit être > 0.';
        if (!form.date_debut)
            e.date_debut = 'La date de début est obligatoire.';
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!valider()) return;
        setLoading(true);
        try {
            await onSubmit({
                nom: form.nom.trim(),
                type: form.type,
                bien_immobilier_id: form.type === 'Immobilier' ? form.bien_immobilier_id : null,
                capital_emprunte: parseFloat(form.capital_emprunte),
                taux_interet: parseFloat(form.taux_interet),
                duree_mois: parseInt(form.duree_mois),
                mensualite: parseFloat(form.mensualite),
                date_debut: form.date_debut,
                rembourse_automatiquement: form.rembourse_automatiquement,
                notes: form.notes || null,
            });
            onClose();
        } catch (err) {
            setErreurs({ _global: err.message || 'Erreur lors de l\'enregistrement.' });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (err) => ({
        width: '100%',
        padding: '10px 12px',
        border: `1px solid ${err ? '#EF4444' : '#D1D5DB'}`,
        borderRadius: 8,
        fontSize: 14,
        outline: 'none',
        background: 'white',
        boxSizing: 'border-box',
    });

    const labelStyle = {
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
        display: 'block',
        marginBottom: 6,
    };

    const errStyle = {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 32,
                    width: '100%',
                    maxWidth: 560,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Titre */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                        {detteInitiale ? '✏️ Modifier un crédit' : '➕ Ajouter un crédit'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}
                    >✕</button>
                </div>

                {erreurs._global && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#EF4444' }}>
                        {erreurs._global}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Nom */}
                    <div>
                        <label style={labelStyle}>Nom du crédit *</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => set('nom', e.target.value)}
                            placeholder="Ex: Crédit immobilier appart Paris"
                            style={inputStyle(erreurs.nom)}
                        />
                        {erreurs.nom && <p style={errStyle}>{erreurs.nom}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <label style={labelStyle}>Type *</label>
                        <select
                            value={form.type}
                            onChange={(e) => set('type', e.target.value)}
                            style={inputStyle(false)}
                        >
                            {TYPES_DETTE.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Bien immobilier lié (conditionnel) */}
                    {form.type === 'Immobilier' && (
                        <div>
                            <label style={labelStyle}>🏠 Bien immobilier lié</label>
                            <select
                                value={form.bien_immobilier_id || ''}
                                onChange={(e) => set('bien_immobilier_id', e.target.value || null)}
                                style={inputStyle(false)}
                            >
                                <option value="">— Aucun —</option>
                                {(biensImmobiliers || []).map((b) => (
                                    <option key={b.id} value={b.id}>{b.nom}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Capital emprunté */}
                    <div>
                        <label style={labelStyle}>Capital emprunté (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.capital_emprunte}
                            onChange={(e) => set('capital_emprunte', e.target.value)}
                            placeholder="200000"
                            style={inputStyle(erreurs.capital_emprunte)}
                        />
                        {erreurs.capital_emprunte && <p style={errStyle}>{erreurs.capital_emprunte}</p>}
                    </div>

                    {/* Taux et durée côte à côte */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Taux d'intérêt (%) *</label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={form.taux_interet}
                                onChange={(e) => set('taux_interet', e.target.value)}
                                placeholder="3.5"
                                style={inputStyle(erreurs.taux_interet)}
                            />
                            {erreurs.taux_interet && <p style={errStyle}>{erreurs.taux_interet}</p>}
                        </div>
                        <div>
                            <label style={labelStyle}>Durée (mois) *</label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={form.duree_mois}
                                onChange={(e) => set('duree_mois', e.target.value)}
                                placeholder="240 (= 20 ans)"
                                style={inputStyle(erreurs.duree_mois)}
                            />
                            {erreurs.duree_mois && <p style={errStyle}>{erreurs.duree_mois}</p>}
                        </div>
                    </div>

                    {/* Mensualité */}
                    <div>
                        <label style={labelStyle}>Mensualité (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.mensualite}
                            onChange={(e) => set('mensualite', e.target.value)}
                            placeholder="900"
                            style={inputStyle(erreurs.mensualite)}
                        />
                        {erreurs.mensualite && <p style={errStyle}>{erreurs.mensualite}</p>}
                        {mensualiteCalc !== null && (
                            <p style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                                💡 Mensualité calculée : <strong>
                                    {mensualiteCalc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </strong> — modifiable
                                {' '}
                                <button
                                    type="button"
                                    onClick={() => set('mensualite', mensualiteCalc.toFixed(2))}
                                    style={{
                                        background: 'none', border: '1px solid #10B981',
                                        borderRadius: 4, padding: '1px 6px', fontSize: 11,
                                        color: '#10B981', cursor: 'pointer', marginLeft: 4,
                                    }}
                                >
                                    Utiliser ce montant
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Date de début */}
                    <div>
                        <label style={labelStyle}>Date de 1ère échéance *</label>
                        <input
                            type="date"
                            value={form.date_debut}
                            onChange={(e) => set('date_debut', e.target.value)}
                            style={inputStyle(erreurs.date_debut)}
                        />
                        {erreurs.date_debut && <p style={errStyle}>{erreurs.date_debut}</p>}
                    </div>

                    {/* Injection auto budget */}
                    <div style={{
                        background: '#F0FDF4',
                        border: '1px solid #D1FAE5',
                        borderRadius: 10,
                        padding: '12px 14px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                    }}>
                        <input
                            type="checkbox"
                            id="rembourse_auto"
                            checked={form.rembourse_automatiquement}
                            onChange={(e) => set('rembourse_automatiquement', e.target.checked)}
                            style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16 }}
                        />
                        <label htmlFor="rembourse_auto" style={{ fontSize: 13, color: '#065F46', cursor: 'pointer' }}>
                            <strong>Injection automatique dans le budget</strong><br />
                            <span style={{ fontWeight: 400, color: '#6B7280' }}>
                                Crée automatiquement une transaction mensuelle de remboursement dans ton budget le 1er de chaque mois.
                            </span>
                        </label>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={labelStyle}>Notes (optionnel)</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => set('notes', e.target.value)}
                            placeholder="Banque, assurance, remarques..."
                            rows={3}
                            style={{ ...inputStyle(false), resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>

                    {/* Boutons */}
                    <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '11px 0',
                                border: '1px solid #D1D5DB',
                                borderRadius: 10,
                                background: 'white',
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#374151',
                                cursor: 'pointer',
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 2,
                                padding: '11px 0',
                                border: 'none',
                                borderRadius: 10,
                                background: loading ? '#9CA3AF' : '#111827',
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? 'Enregistrement...' : '✓ Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}