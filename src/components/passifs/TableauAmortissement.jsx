// src/components/passifs/TableauAmortissement.jsx
import { useEffect } from 'react';
import { genererTableauAmortissement, calculerCRD, calculerCoutTotalCredit } from '../../utils/financeCredit';

export function TableauAmortissement({ dette, ouvert, onClose }) {
    // Fermeture avec Escape
    useEffect(() => {
        if (!ouvert) return;
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [ouvert, onClose]);

    if (!ouvert || !dette) return null;

    const tableau = genererTableauAmortissement({
        capitalEmprunte: dette.capital_emprunte,
        tauxInteret: dette.taux_interet,
        dureeMois: dette.duree_mois,
        mensualite: dette.mensualite,
        dateDebut: dette.date_debut,
    });

    const crdActuel = calculerCRD({
        capitalEmprunte: dette.capital_emprunte,
        tauxInteret: dette.taux_interet,
        dureeMois: dette.duree_mois,
        mensualite: dette.mensualite,
        dateDebut: dette.date_debut,
    });

    const coutTotal = calculerCoutTotalCredit({
        mensualite: dette.mensualite,
        dureeMois: dette.duree_mois,
        capitalEmprunte: dette.capital_emprunte,
    });

    const aujourd_hui = new Date();
    const debut = new Date(dette.date_debut);
    const moisEcoules =
        (aujourd_hui.getFullYear() - debut.getFullYear()) * 12 +
        (aujourd_hui.getMonth() - debut.getMonth());

    const formatEur = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    };

    const modalStyle = {
        background: 'white',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 800,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    };

    const badgeStyle = (color, bg) => ({
        background: bg || '#F3F4F6',
        color: color || '#374151',
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
    });

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

                {/* En-tête */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                            📊 Tableau d'amortissement — {dette.nom}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 20, color: '#9CA3AF', lineHeight: 1,
                            }}
                        >✕</button>
                    </div>

                    {/* Badges résumé */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={badgeStyle('#1D4ED8', '#DBEAFE')}>
                            💶 Capital : {formatEur(dette.capital_emprunte)}
                        </span>
                        <span style={badgeStyle('#4B5563', '#F3F4F6')}>
                            📅 Durée : {dette.duree_mois} mois
                        </span>
                        <span style={badgeStyle('#065F46', '#D1FAE5')}>
                            📈 Taux : {dette.taux_interet}%
                        </span>
                    </div>

                    {/* CRD actuel mis en avant */}
                    <div style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>Capital restant dû aujourd'hui :</span>
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#EF4444' }}>
                            {formatEur(crdActuel)}
                        </span>
                    </div>
                </div>

                {/* Tableau scrollable */}
                <div style={{ overflowY: 'auto', maxHeight: 400, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', position: 'sticky', top: 0 }}>
                                {['#', 'Date', 'Mensualité', 'Intérêts', 'Amortissement', 'Capital Restant'].map((col) => (
                                    <th key={col} style={{
                                        padding: '10px 12px',
                                        textAlign: col === '#' ? 'center' : 'right',
                                        fontWeight: 600,
                                        color: '#374151',
                                        borderBottom: '2px solid #E5E7EB',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableau.map((ligne, idx) => {
                                const estPasse = ligne.mois < moisEcoules;
                                const estCourant = ligne.mois === moisEcoules;

                                let rowStyle = {};
                                if (estPasse) rowStyle = { background: '#F9FAFB' };
                                if (estCourant) rowStyle = {
                                    background: '#F0F9FF',
                                    borderLeft: '3px solid #3B82F6',
                                };

                                return (
                                    <tr key={ligne.mois} style={rowStyle}>
                                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#9CA3AF', fontWeight: estCourant ? 700 : 400 }}>
                                            {estCourant ? '▶' : ligne.mois}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: estPasse ? '#9CA3AF' : '#374151', fontStyle: estPasse ? 'italic' : 'normal' }}>
                                            {formatDate(ligne.date)}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>
                                            {formatEur(ligne.mensualite)}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#EF4444' }}>
                                            {formatEur(ligne.interets)}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#10B981' }}>
                                            {formatEur(ligne.amortissement)}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: estCourant ? 700 : 500, color: estCourant ? '#3B82F6' : '#374151' }}>
                                            {formatEur(ligne.capitalRestant)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                        💡 Total intérêts payés sur la durée :{' '}
                        <strong style={{ color: '#EF4444' }}>{formatEur(coutTotal)}</strong>
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#111827',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            padding: '10px 24px',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
