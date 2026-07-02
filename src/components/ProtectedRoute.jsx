import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const { user, profile } = useAuth()
    const location = useLocation()

    if (!user) return <Navigate to="/login" replace />

    if (
        profile &&
        profile.onboarding_completed === false &&
        location.pathname !== '/onboarding'
    ) {
        return <Navigate to="/onboarding" replace />
    }

    return children
}

export default ProtectedRoute