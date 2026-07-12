import { createContext, useContext, useState, useEffect } from 'react';

const IncognitoContext = createContext();

export function IncognitoProvider({ children }) {
  const [incognito, setIncognito] = useState(() => {
    try {
      const saved = localStorage.getItem('fondora_incognito');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('fondora_incognito', JSON.stringify(incognito));
  }, [incognito]);

  const toggleIncognito = () => {
    setIncognito(prev => !prev);
  };

  return (
    <IncognitoContext.Provider value={{ incognito, toggleIncognito }}>
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
