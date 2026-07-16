import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Synthese from './pages/Synthese'
import Budget from './pages/Budget'
import Patrimoine from './pages/Patrimoine'
import Investir from './pages/Investir'
import Analyse from './pages/Analyse'
import Parametres from './pages/Parametres'
import PassifsPage from './pages/PassifsPage'
import Onboarding from './pages/Onboarding'
import ProtectedRoute from './components/ProtectedRoute'
import VerifyMFA from './pages/auth/VerifyMFA'
import MFAGuard from './components/auth/MFAGuard'
import { CurrencyProvider } from './context/CurrencyContext'
import SupprimerCompteConfirmer from './pages/SupprimerCompteConfirmer'
import { IncognitoProvider } from './context/IncognitoContext'
import { useAuth } from './context/AuthContext' // ✅ Importation essentielle pour le routage dynamique

// Pages Légales et Export
import MentionsLegales from './pages/legal/MentionsLegales'
import Cgu from './pages/legal/CGU'
import PolitiqueConfidentialite from './pages/legal/PolitiqueConfidentialite'
import ExportDonnees from './pages/ExportDonnees'

// Composants globaux RGPD
import CookieBanner from './components/CookieBanner'
import ReconsentementModal from './components/ReconsentementModal'

// ✅ Composant d'aiguillage dynamique pour la racine "/"
function Home() {
  const { user } = useAuth()
  return user ? <Navigate to="/synthese" replace /> : <LandingPage />
}

function AppRoutes() {
  return (
    <MFAGuard>
      <Routes>
        {/* === ROUTE DYNAMIQUE D'ACCUEIL === */}
        <Route path="/" element={<Home />} />

        {/* === ROUTES PUBLIQUES === */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/verify-mfa" element={<VerifyMFA />} />

        {/* === ROUTES PROTÉGÉES === */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/synthese" element={<ProtectedRoute><Synthese /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/patrimoine" element={<ProtectedRoute><Patrimoine /></ProtectedRoute>} />
        <Route path="/investir" element={<ProtectedRoute><Investir /></ProtectedRoute>} />
        <Route path="/analyse" element={<ProtectedRoute><Analyse /></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
        <Route path="/passifs" element={<ProtectedRoute><PassifsPage /></ProtectedRoute>} />
        <Route path="/export-donnees" element={<ProtectedRoute><ExportDonnees /></ProtectedRoute>} />
        <Route path="/supprimer-compte/confirmer" element={<SupprimerCompteConfirmer />} />

        {/* Redirection globale de sécurité */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
      <ReconsentementModal />
    </MFAGuard>
  )
}

function App() {
  return (
    <IncognitoProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            {/* Pages légales accessibles sans authentification ni MFA */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgu" element={<Cgu />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />

            {/* Application principale */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </CurrencyProvider>
    </IncognitoProvider>
  )
}

export default App