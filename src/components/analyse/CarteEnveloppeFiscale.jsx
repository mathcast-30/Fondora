export function CarteEnveloppeFiscale({ enveloppe }) {
  const {
    typeEnveloppe, nom, valeurActuelle, plusValueBrute,
    impotLatent, netInPocket, tauxEffectif,
    apres5ans, apres8ans, anneesDetention,
  } = enveloppe;

  const badgeColor = typeEnveloppe === 'PEA' ? '#6366f1'
    : typeEnveloppe === 'CTO' ? '#f59e0b'
    : typeEnveloppe === 'Crypto' ? '#f97316'
    : '#8b5cf6'; // AV

  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const pct = (n) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="carte-enveloppe" style={{ borderLeft: `4px solid ${badgeColor}` }}>
      <div className="carte-header">
        <span className="badge" style={{ background: badgeColor, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>
          {typeEnveloppe}
        </span>
        <strong>{nom}</strong>
        {anneesDetention && (
          <span style={{ fontSize: 12, color: 'gray' }}>
            {anneesDetention.toFixed(1)} ans
            {typeEnveloppe === 'PEA' && (apres5ans ? ' ✅ +5 ans' : ' ⏳ -5 ans')}
            {typeEnveloppe === 'AV' && (apres8ans ? ' ✅ +8 ans' : ' ⏳ -8 ans')}
          </span>
        )}
      </div>

      <div className="carte-lignes">
        <div className="ligne">
          <span>Valeur actuelle</span>
          <strong>{formatter.format(valeurActuelle)}</strong>
        </div>
        <div className="ligne">
          <span>Plus-value latente</span>
          <strong style={{ color: plusValueBrute > 0 ? '#10b981' : 'gray' }}>
            {formatter.format(plusValueBrute)}
          </strong>
        </div>
        <div className="ligne" style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 4, padding: '4px 8px' }}>
          <span>Impôt latent ({pct(tauxEffectif)})</span>
          <strong style={{ color: '#ef4444' }}>{formatter.format(impotLatent)}</strong>
        </div>
        <div className="ligne" style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 4, padding: '4px 8px' }}>
          <span>💰 Net in Pocket</span>
          <strong style={{ color: '#10b981', fontSize: 16 }}>{formatter.format(netInPocket)}</strong>
        </div>
      </div>
    </div>
  );
}
