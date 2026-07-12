import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useMFA } from '../../hooks/useMFA';

export default function MFASetup() {
  const [step, setStep] = useState('loading'); // loading, disabled, enrolling, recovery, enabled
  const [factorId, setFactorId] = useState(null);
  const [enrollData, setEnrollData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const canvasRef = useRef(null);
  const { getMFAStatus, enrollMFA, verifyEnrollment, unenrollMFA } = useMFA();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await getMFAStatus();
      if (status.enabled) {
        setFactorId(status.factorId);
        setStep('enabled');
      } else {
        setStep('disabled');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur de chargement');
      setStep('disabled');
    }
  };

  const handleEnroll = async () => {
    setError(null);
    try {
      const data = await enrollMFA();
      setEnrollData(data);
      setFactorId(data.id);
      setStep('enrolling');
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'activation");
    }
  };

  useEffect(() => {
    if (step === 'enrolling' && enrollData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, enrollData.totp.uri, function (err) {
        if (err) console.error(err);
      });
    }
  }, [step, enrollData]);

  const handleVerify = async () => {
    setError(null);
    try {
      await verifyEnrollment(factorId, code);
      
      // Generate recovery codes
      const codes = [];
      for (let i = 0; i < 8; i++) {
        const array = new Uint16Array(2);
        crypto.getRandomValues(array);
        const p1 = array[0].toString(16).padStart(4, '0');
        const p2 = array[1].toString(16).padStart(4, '0');
        codes.push(`${p1}-${p2}`.toUpperCase());
      }
      setRecoveryCodes(codes);
      setStep('recovery');
    } catch (err) {
      console.error(err);
      setError('Code invalide');
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    alert('Codes copiés !');
  };

  const handleDisable = async () => {
    if (!window.confirm('Voulez-vous vraiment désactiver la double authentification ?')) return;
    try {
      await unenrollMFA(factorId);
      setStep('disabled');
      setFactorId(null);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la désactivation');
    }
  };

  if (step === 'loading') return <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Chargement MFA...</div>;

  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
      <h3 style={{ color: 'var(--text-h)', marginTop: 0 }}>Authentification à deux facteurs (2FA)</h3>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {step === 'disabled' && (
        <div>
          <p style={{ color: 'var(--text)' }}>Protégez votre compte avec une étape de sécurité supplémentaire.</p>
          <button 
            onClick={handleEnroll}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Activer la double authentification
          </button>
        </div>
      )}

      {step === 'enrolling' && (
        <div>
          <p style={{ color: 'var(--text)' }}>1. Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)</p>
          <div style={{ margin: '1rem 0', backgroundColor: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px' }}>
            <canvas ref={canvasRef}></canvas>
          </div>
          <p style={{ color: 'var(--text)' }}>Ou saisissez ce secret manuellement : <strong style={{ userSelect: 'all' }}>{enrollData?.totp?.secret}</strong></p>
          
          <p style={{ color: 'var(--text)', marginTop: '1.5rem' }}>2. Entrez le code généré par l'application :</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code à 6 chiffres" 
              maxLength={6}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
            <button 
              onClick={handleVerify}
              disabled={code.length !== 6}
              style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <h4 style={{ color: 'var(--text-h)' }}>Clés de secours</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            <strong>Important :</strong> Sauvegardez ces codes en lieu sûr. Ils ne seront plus affichés. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0', fontFamily: 'monospace', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '4px', color: 'var(--text)' }}>
            {recoveryCodes.map(c => <div key={c}>{c}</div>)}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleCopyCodes} style={{ padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}>
              Copier tout
            </button>
            <button 
              onClick={() => setStep('enabled')}
              style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              J'ai sauvegardé mes codes
            </button>
          </div>
        </div>
      )}

      {step === 'enabled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ backgroundColor: 'green', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>
            ✓ 2FA activé
          </span>
          <button 
            onClick={handleDisable}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', color: 'red', border: '1px solid red', borderRadius: '4px', cursor: 'pointer' }}
          >
            Désactiver
          </button>
        </div>
      )}
    </div>
  );
}
