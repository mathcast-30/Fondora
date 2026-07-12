import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
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

function AppRoutes() {
  return (
    <MFAGuard>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/verify-mfa" element={<VerifyMFA />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Synthese /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/patrimoine" element={<ProtectedRoute><Patrimoine /></ProtectedRoute>} />
        <Route path="/investir" element={<ProtectedRoute><Investir /></ProtectedRoute>} />
        <Route path="/analyse" element={<ProtectedRoute><Analyse /></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
        <Route path="/passifs" element={<ProtectedRoute><PassifsPage /></ProtectedRoute>} />
        <Route path="/supprimer-compte/confirmer" element={<SupprimerCompteConfirmer />} />
      </Routes>
    </MFAGuard>
  )
}

function App() {
  return (
    <IncognitoProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <AppRoutes />
          <Analytics />
        </BrowserRouter>
      </CurrencyProvider>
    </IncognitoProvider>
  )
}

export default App