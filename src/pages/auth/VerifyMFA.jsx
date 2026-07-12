import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMFA } from '../../hooks/useMFA';

export default function VerifyMFA() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState(null);
  const navigate = useNavigate();
  const { getMFAStatus, verifyMFA } = useMFA();

  useEffect(() => {
    const loadFactor = async () => {
      try {
        const status = await getMFAStatus();
        if (status.enabled) {
          setFactorId(status.factorId);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement du statut MFA');
      }
    };
    loadFactor();
  }, [navigate]); // getMFAStatus is not memoized, omitting it to prevent loops

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factorId) return;
    
    setError(null);
    setLoading(true);
    try {
      await verifyMFA(factorId, code);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border)', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: 'var(--text-h)', textAlign: 'center', marginBottom: '1.5rem' }}>Vérification en deux étapes</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres" 
            maxLength={6}
            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            required
          />
          <button 
            type="submit" 
            disabled={loading || code.length !== 6}
            style={{ padding: '0.75rem', backgroundColor: 'var(--primary, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Vérification...' : 'Valider'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
