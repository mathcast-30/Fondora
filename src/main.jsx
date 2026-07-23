import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ParametresProvider } from './context/ParametresContext.jsx'; // NOUVEAU

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ParametresProvider> {/* NOUVEAU: Enveloppe l'application */}
        <App />
      </ParametresProvider>
    </AuthProvider>
  </StrictMode>,
);