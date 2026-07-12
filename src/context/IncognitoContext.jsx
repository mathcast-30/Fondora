import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const IncognitoContext = createContext();

export function IncognitoProvider({ children }) {
  const [incognito, setIncognito] = useState(() => {
    try {
      const saved = localStorage.getItem('fondora_incognito');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('fondora_incognito', JSON.stringify(incognito));
  }, [incognito]);

  const toggleIncognito = () => {
    setIncognito(prev => !prev);
  };

  const value = useMemo(() => ({ incognito, toggleIncognito }), [incognito]);

  return (
    <IncognitoContext.Provider value={value}>
      {children}
    </IncognitoContext.Provider>
  );
}

export function useIncognito() {
  const context = useContext(IncognitoContext);
  if (!context) {
    throw new Error('useIncognito must be used within an IncognitoProvider');
  }
  return context;
}
