// src/components/passifs/FormDette.jsx
// Champs à inclure dans ton modal (avec react state ou react-hook-form)

const CHAMPS = [
    {
        name: 'nom', label: 'Nom du crédit', type: 'text',
        placeholder: 'Ex: Crédit immobilier appart Paris'
    },

    {
        name: 'type', label: 'Type', type: 'select',
        options: ['Immobilier', 'Consommation', 'Automobile', 'Dette Privée', 'Fiscale', 'Autre']
    },

    // Conditionnel — n'apparaît que si type === 'Immobilier'
    {
        name: 'bien_immobilier_id', label: 'Bien immobilier lié', type: 'select_biens',
        conditionnel: true
    },

    { name: 'capital_emprunte', label: 'Capital emprunté (€)', type: 'number' },
    { name: 'taux_interet', label: 'Taux d\'intérêt (%)', type: 'number', step: '0.001' },
    {
        name: 'duree_mois', label: 'Durée (mois)', type: 'number',
        helper: 'Ex: 240 pour 20 ans'
    },
    {
        name: 'mensualite', label: 'Mensualité (€)', type: 'number',
        helper: 'Hors assurance'
    },
    { name: 'date_debut', label: 'Date de 1ère échéance', type: 'date' },

    {
        name: 'rembourse_automatiquement', label: 'Injection auto en budget',
        type: 'checkbox',
        helper: 'Crée automatiquement une transaction mensuelle dans ton budget'
    },

    { name: 'notes', label: 'Notes', type: 'textarea' },
];