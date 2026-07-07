import { calculerDecompositionGain } from '../../utils/devises';
import './DecompositionGain.css';

export default function DecompositionGain({
    symbole,
    prixAchatDevise,
    prixActuelDevise,
    devisActif,
    tauxAchat,
    tauxActuel,
}) {
    if (!prixAchatDevise || prixAchatDevise <= 0 || !tauxAchat || tauxAchat <= 0) {
        return null;
    }

    const { gainDevise, gainChange, gainTotal } = calculerDecompositionGain(
        prixAchatDevise,
        prixActuelDevise,
        tauxAchat,
        tauxActuel
    );

    const formatGain = (valeur) => {
        const signe = valeur >= 0 ? '+' : '';
        return `${signe}${valeur.toFixed(2)} %`;
    };

    const classGain = (valeur) => (valeur >= 0 ? 'positif' : 'negatif');

    return (
        <div className="decomposition-wrapper">
            <p className="decomposition-titre">
                Décomposition de la performance{symbole ? ` — ${symbole}` : ''}
            </p>

            <div className="decomposition-ligne">
                <span>Performance actif ({devisActif})</span>
                <span className={classGain(gainDevise)}>{formatGain(gainDevise)}</span>
            </div>

            <div className="decomposition-ligne">
                <span>Effet devises (EUR / {devisActif})</span>
                <span className={classGain(gainChange)}>{formatGain(gainChange)}</span>
            </div>

            <div className="decomposition-ligne total">
                <span>Performance totale en EUR</span>
                <span className={classGain(gainTotal)}>{formatGain(gainTotal)}</span>
            </div>

            <p className="decomposition-note">
                La somme n'est pas exactement additive (effet multiplicatif).
            </p>
        </div>
    );
}
