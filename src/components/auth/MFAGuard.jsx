import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMFA } from '../../hooks/useMFA';

export default function MFAGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAAL } = useMFA();

  useEffect(() => {
    const checkMFA = async () => {
      const exempted = ['/login', '/signup', '/auth/verify-mfa', '/supprimer-compte/confirmer'];
      if (
        exempted.includes(location.pathname) ||
        location.pathname.startsWith('/auth/') ||
        location.pathname.startsWith('/onboarding')
      ) return;

      try {
        const aal = await getAAL();
        if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
          navigate('/auth/verify-mfa', { replace: true });
        }
      } catch (err) {
        console.error('Erreur vérification AAL', err);
      }
    };

    checkMFA();
  }, [location.pathname, navigate]);

  return children;
}