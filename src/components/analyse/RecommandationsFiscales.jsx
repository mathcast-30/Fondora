export function RecommandationsFiscales({ recommandations }) {
  if (!recommandations.length) {
    return (
      <div className="recommandation success">
        <span>✅</span>
        <div>
          <strong>Fiscalité optimisée !</strong>
          <p>Aucune alerte détectée sur vos enveloppes.</p>
        </div>
      </div>
    );
  }

  const icone = { warning: '⚠️', info: 'ℹ️', success: '✅' };

  return (
    <div className="recommandations-liste">
      {recommandations.map((r, i) => (
        <div key={i} className={`recommandation ${r.type}`}>
          <span>{icone[r.type]}</span>
          <div>
            <strong>{r.titre}</strong>
            <p>{r.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
