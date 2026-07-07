import { useTauxChange } from '../../hooks/useTauxChange';
import './AffichageTaux.css';

const PAIRES = ['USD', 'GBP', 'CHF', 'JPY'];

function TauxSkeleton() {
    return (
        <div className="taux-carte">
            <div className="taux-skeleton" style={{ width: '60px', marginBottom: '8px' }}></div>
            <div className="taux-skeleton" style={{ width: '100px', height: '28px', marginBottom: '4px' }}></div>
            <div className="taux-skeleton" style={{ width: '80px' }}></div>
        </div>
    );
}

export default function AffichageTaux() {
    const { taux, loading, error, rafraichir, derniereMaj } = useTauxChange();

    const isInitialLoading = loading && !Object.keys(taux).some(k => k !== 'EUR');

    return (
        <div className="affichage-taux-wrapper">
            <h3 className="affichage-taux-titre">Taux de change en temps réel</h3>

            {error && (
                <div className="taux-error">{error}</div>
            )}

            <div className="taux-grille">
                {isInitialLoading
                    ? PAIRES.map(d => <TauxSkeleton key={d} />)
                    : PAIRES.map(devise => (
                        <div key={devise} className="taux-carte">
                            <div className="taux-paire">EUR / {devise}</div>
                            <div className="taux-valeur">
                                {taux[devise]
                                    ? taux[devise].toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                                    : '—'}
                            </div>
                            <div className="taux-sous-titre">
                                1 EUR = {taux[devise] ? taux[devise].toFixed(4) : '—'} {devise}
                            </div>
                        </div>
                    ))
                }
            </div>

            <div className="taux-footer">
                <span>
                    {derniereMaj
                        ? `Dernière mise à jour : ${new Date(derniereMaj).toLocaleTimeString('fr-FR')}`
                        : 'Chargement des taux...'}
                </span>
                <button
                    className="taux-btn-actualiser"
                    onClick={rafraichir}
                    disabled={loading}
                >
                    {loading ? 'Chargement...' : '↻ Actualiser'}
                </button>
            </div>
        </div>
    );
}
