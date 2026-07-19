import React from 'react';
import { useIncognito } from '../context/IncognitoContext';

export default function SecureValue({ value, formatter, blur }) {
  const { incognito } = useIncognito();

  const isBlurred = incognito || blur;
  const displayValue = formatter ? formatter(value) : value;

  const style = {
    transition: 'filter 0.2s ease',
    ...(isBlurred && {
      filter: 'blur(8px)',
      userSelect: 'none',
      pointerEvents: 'none',
    })
  };

  return (
    <span style={style}>
      {displayValue}
    </span>
  );
}
