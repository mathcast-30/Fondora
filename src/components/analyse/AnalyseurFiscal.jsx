import { useFiscaliteGlobale } from '../../hooks/useFiscaliteGlobale';
import { ScoreEfficaciteFiscale } from './ScoreEfficaciteFiscale';
import { CarteEnveloppeFiscale } from './CarteEnveloppeFiscale';
import { RecommandationsFiscales } from './RecommandationsFiscales';

export function AnalyseurFiscal() {
  const { loading, error, data } = useFiscaliteGlobale();
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement de l'analyse fiscale...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Erreur : {error}</div>;
  if (!data) return null;

  const { enveloppesAnalysees, score, recommandations, totaux, situationFamiliale } = data;

  return (
    <div className="analyseur-fiscal">

      {/* Bandeau récapitulatif */}
      <div className="bandeau-recap">
        <div className="kpi">
          <span>Valeur brute totale</span>
          <strong>{formatter.format(totaux.valeurBrute)}</strong>
        </div>
        <div className="kpi kpi-danger">
          <span>Impôt latent total</span>
          <strong style={{ color: '#ef4444' }}>{formatter.format(totaux.impotLatentTotal)}</strong>
        </div>
        <div className="kpi kpi-success">
          <span>💰 Net in Pocket global</span>
          <strong style={{ color: '#10b981', fontSize: 22 }}>{formatter.format(totaux.netInPocketTotal)}</strong>
        </div>
        <div className="kpi">
          <span>Plus-values totales</span>
          <strong>{formatter.format(totaux.plusValueBruteTotal)}</strong>
        </div>
      </div>

      {/* Note sur le profil fiscal */}
      <div className="profil-fiscal-note">
        <span>🧾</span>
        <span>
          Calculs effectués pour un profil{' '}
          <strong>{situationFamiliale === 'marie' ? 'Marié(e) / Pacsé(e)' : 'Célibataire'}</strong>
          {' '}— abattement AV : {situationFamiliale === 'marie' ? '9 200' : '4 600'}€/an.
          Modifiable dans les Paramètres.
        </span>
      </div>

      {/* Grille principale */}
      <div className="grille-deux-colonnes">

        {/* Colonne gauche : Score + Recommandations */}
        <div>
          <ScoreEfficaciteFiscale score={score} />
          <h3 className="text-navy font-semibold text-lg mb-4">Recommandations</h3>
          <RecommandationsFiscales recommandations={recommandations} />
        </div>

        {/* Colonne droite : Enveloppes */}
        <div>
          <h3 className="text-navy font-semibold text-lg mb-4">Analyse par enveloppe</h3>
          {enveloppesAnalysees.length === 0 ? (
            <p>Aucun investissement renseigné.</p>
          ) : (
            enveloppesAnalysees.map((env, i) => (
              <CarteEnveloppeFiscale key={i} enveloppe={env} />
            ))
          )}
        </div>

      </div>

      {/* Mention légale */}
      <p style={{ fontSize: 12, color: 'gray', marginTop: 32, textAlign: 'center' }}>
        ⚠️ Ces calculs sont indicatifs et basés sur les règles fiscales françaises 2026.
        Ils ne constituent pas un conseil fiscal. Consultez un professionnel pour votre situation personnelle.
      </p>
    </div>
  );
}
