import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import './SwitchDevise.css';

const DEVISES = [
    { code: 'EUR', nom: 'Euro' },
    { code: 'USD', nom: 'Dollar américain' },
    { code: 'GBP', nom: 'Livre sterling' },
    { code: 'CHF', nom: 'Franc suisse' },
    { code: 'JPY', nom: 'Yen japonais' },
    { code: 'CAD', nom: 'Dollar canadien' },
    { code: 'AUD', nom: 'Dollar australien' },
    { code: 'SEK', nom: 'Couronne suédoise' },
    { code: 'NOK', nom: 'Couronne norvégienne' },
    { code: 'DKK', nom: 'Couronne danoise' },
];

export default function SwitchDevise() {
    const { deviseReference, setDeviseReference } = useCurrency();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = async (e) => {
        const nouvelleDevise = e.target.value;
        setSaving(true);
        setSaved(false);
        await setDeviseReference(nouvelleDevise);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="switch-devise-wrapper">
            <label className="switch-devise-label" htmlFor="switch-devise-select">
                Devise de référence
            </label>
            <select
                id="switch-devise-select"
                className="switch-devise-select"
                value={deviseReference}
                onChange={handleChange}
                disabled={saving}
            >
                {DEVISES.map(({ code, nom }) => (
                    <option key={code} value={code}>
                        {code} – {nom}
                    </option>
                ))}
            </select>
            <div className="switch-devise-status">
                {saving && (
                    <span className="switch-devise-saving">
                        <svg className="spinner" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" strokeDasharray="22" strokeDashoffset="8" strokeLinecap="round" />
                        </svg>
                        Enregistrement...
                    </span>
                )}
                {saved && !saving && (
                    <span className="switch-devise-saved">✓ Enregistré</span>
                )}
            </div>
        </div>
    );
}
