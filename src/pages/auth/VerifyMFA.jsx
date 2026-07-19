import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMFA } from '../../hooks/useMFA';

export default function VerifyMFA() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState(null);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { getMFAStatus, verifyMFA } = useMFA();

  // Chargement du statut MFA
  useEffect(() => {
    const loadFactor = async () => {
      try {
        const status = await getMFAStatus();
        if (status.enabled) {
          setFactorId(status.factorId);
          // Auto-focus sur la première case
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement du statut MFA');
      }
    };
    loadFactor();
  }, [navigate]);

  // Validation du formulaire
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullCode = code.join('');
    if (!factorId || fullCode.length !== 6) return;

    setError(null);
    setLoading(true);
    try {
      await verifyMFA(factorId, fullCode);
      navigate('/synthese');
    } catch (err) {
      console.error(err);
      setError('Code invalide ou expiré. Veuillez réessayer.');
      setCode(['', '', '', '', '', '']); // Réinitialisation en cas d'erreur
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  // Soumission automatique si les 6 cases sont remplies sans erreur
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && factorId && !error) {
      handleSubmit();
    }
  }, [code, factorId, error]);

  // Gestion de la frappe au clavier pour passer de case en case
  const handleChange = (index, value) => {
    // N'accepter que les chiffres
    if (value && !/^[0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur la case suivante si on a tapé un chiffre
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Auto-focus sur la case précédente si on efface
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      // Focus sur la dernière case remplie
      const nextFocusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocusIndex].focus();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isCodeComplete = code.join('').length === 6;

  return (
    <div className="relative min-h-screen bg-[#0a1f33] text-white flex items-center justify-center p-6 overflow-hidden font-sans">

      {/* 1. FOND ANIMÉ */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#10b981]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[150px]" style={{ animationDuration: '9s' }}></div>

      {/* 2. BOUTON RETOUR / DÉCONNEXION */}
      <button
        onClick={handleLogout}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-all z-20 group"
      >
        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Annuler la connexion
      </button>

      {/* 3. CARTE DE VÉRIFICATION (GLASSMORPHISM) */}
      <div className="relative z-10 w-full max-w-md bg-[#122a44]/60 border border-slate-700 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#10b981]/5">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0a1f33] rounded-2xl border border-slate-600 flex items-center justify-center mx-auto mb-6 shadow-inner shadow-[#10b981]/10">
            <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mt-3 text-white tracking-tight">Authentification requise</h2>
          <p className="text-slate-400 text-sm mt-2">
            Veuillez saisir le code à 6 chiffres généré par votre application d'authentification (ex: Google Authenticator).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center flex items-center justify-center gap-2 animate-[shake_0.5s_ease-in-out]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Les 6 cases de saisie (Option B) */}
          <div
            className="flex justify-between gap-2"
            onPaste={handlePaste}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl transition-all outline-none 
                  ${digit
                    ? 'bg-[#0a1f33] border-[#10b981] text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0a1f33]/60 border-slate-600 text-slate-400 focus:border-slate-400 focus:bg-[#0a1f33]'
                  } border`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !isCodeComplete}
            className={`w-full font-bold py-4 px-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2
              ${isCodeComplete && !loading
                ? 'bg-[#10b981] hover:bg-[#0e9f6e] text-[#0a1f33] shadow-[0_0_20px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vérification...
              </>
            ) : (
              'Valider l\'accès'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}