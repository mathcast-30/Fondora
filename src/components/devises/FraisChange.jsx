import { useState } from 'react';
import { calculerFraisChange, formaterMontantAvecDevise } from '../../utils/devises';
import './FraisChange.css';

export default function FraisChange({ montant, deviseSrc, deviseDst }) {
    const [tooltipVisible, setTooltipVisible] = useState(false);

    if (!montant || montant <= 0 || deviseSrc === deviseDst) return null;

    const { fraisMin, fraisMax, applicable } = calculerFraisChange(montant, deviseSrc, deviseDst);

    if (!applicable) return null;

    return (
        <div className="frais-change-wrapper">
            <span>Frais de change estimés :</span>
            <span className="frais-change-montants">
                {formaterMontantAvecDevise(fraisMin, deviseDst)} – {formaterMontantAvecDevise(fraisMax, deviseDst)}
            </span>
            <button
                type="button"
                className="frais-change-icone"
                onClick={() => setTooltipVisible(v => !v)}
                aria-label="Informations sur les frais de change"
            >
                ⓘ
                {tooltipVisible && (
                    <span className="frais-change-tooltip">
                        Les frais réels dépendent de votre courtier ou banque. Estimation basée sur les pratiques du marché (0,1 % – 0,5 %).
                    </span>
                )}
            </button>
        </div>
    );
}
