import React, { useState, useEffect } from 'react';
import { useIncognito } from '../context/IncognitoContext';
import { Eye } from 'lucide-react';

export default function SecureValue({ value, formatter, blur, className = '' }) {
  const { incognito } = useIncognito();
  const [revealed, setRevealed] = useState(false);

  const isBlurred = incognito || blur;
  const displayValue = formatter ? formatter(value) : value;

  // Remasquer quand le mode incognito change
  useEffect(() => {
    if (!isBlurred) setRevealed(false);
  }, [isBlurred]);

  // Mode normal — rendu simple sans logique
  if (!isBlurred) {
    return <span className={className}>{displayValue}</span>;
  }

  // Mode incognito — chaque valeur cliquable individuellement
  return (
    <span
      className={className}
      onClick={() => setRevealed(prev => !prev)}
      title={revealed ? 'Cliquer pour masquer' : 'Cliquer pour révéler'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <span
        style={{
          filter: revealed ? 'none' : 'blur(8px)',
          transition: 'filter 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        {displayValue}
      </span>

      {!revealed && (
        <Eye
          size={12}
          style={{
            color: 'rgba(148, 163, 184, 0.5)',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  );
}