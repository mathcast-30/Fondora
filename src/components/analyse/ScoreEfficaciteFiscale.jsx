import { PieChart, Pie, Cell } from 'recharts';

export function ScoreEfficaciteFiscale({ score }) {
  const couleur = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Moyen' : 'À optimiser';

  return (
    <div className="score-card">
      <h3>Score d'Efficacité Fiscale</h3>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx={90}
            cy={90}
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={couleur} />
            <Cell fill="var(--color-graylight)" />
          </Pie>
        </PieChart>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: couleur }}>{score}</div>
          <div style={{ fontSize: 12, color: 'var(--text)' }}>/100</div>
        </div>
      </div>
      <p style={{ color: couleur, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 14, color: 'gray' }}>
        Un score de 100 signifie que toutes vos plus-values sont dans des enveloppes optimisées (PEA après 5 ans).
      </p>
    </div>
  );
}
