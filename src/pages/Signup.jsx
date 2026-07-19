import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { data, error } = await signUp(email, password);

            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
            } else {
                // ✅ Vérification si la session est immédiatement active ou si un e-mail de confirmation est requis
                if (data?.session) {
                    navigate('/onboarding');
                } else {
                    setSuccessMsg('Compte créé avec succès ! Un e-mail de confirmation vous a été envoyé. Veuillez cliquer sur le lien pour valider votre inscription.');
                    setEmail('');
                    setPassword('');
                    setLoading(false);
                }
            }
        } catch (err) {
            setErrorMsg("Une erreur inattendue est survenue lors de l'inscription.");
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            setErrorMsg("Erreur lors de la connexion avec Google.");
        }
    };

    return (
        <div className="relative min-h-screen bg-[#0a1f33] text-white flex items-center justify-center p-6 overflow-hidden font-sans">

            {/* Fond décoratif */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#10b981]/15 rounded-full blur-[150px]"></div>

            <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-all z-20">
                ← Retour
            </button>

            {/* Carte Glassmorphism */}
            <div className="relative z-10 w-full max-w-md bg-[#122a44]/60 border border-slate-700 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#10b981]/5">
                <div className="text-center mb-8">
                    <span className="text-2xl font-extrabold tracking-wider text-[#10b981]">FONDORA</span>
                    <h2 className="text-xl font-bold mt-3 text-white">Créer votre compte</h2>
                    <p className="text-slate-400 text-sm mt-1">Rejoignez-nous et prenez le contrôle de vos finances.</p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-xl text-center">
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-[#10b981]/50 text-[#10b981] text-sm rounded-xl text-center leading-relaxed">
                        {successMsg}
                    </div>
                )}

                {!successMsg && (
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Adresse Email</label>
                            <input
                                type="email"
                                required
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0a1f33]/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mot de passe</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0a1f33]/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#10b981] hover:bg-[#0e9f6e] text-[#0a1f33] font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#10b981]/20 disabled:opacity-50"
                        >
                            {loading ? 'Création...' : 'Créer mon compte'}
                        </button>
                    </form>
                )}

                {!successMsg && (
                    <>
                        <div className="relative my-6 flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest">ou avec</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.39 2.67 1.47 6.56l3.84 2.97c.9-2.7 3.41-4.49 6.69-4.49z" />
                                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.98 3.38-4.89 3.38-8.49z" />
                                <path fill="#FBBC05" d="M5.31 14.53c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.47 6.56C.53 8.47 0 10.6 0 12.8s.53 4.33 1.47 6.24l3.84-2.97z" />
                                <path fill="#34A853" d="M12 23.64c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.28 0-6.1-2.21-7.09-5.18L1.47 16.7c1.92 3.96 5.88 6.94 10.53 6.94z" />
                            </svg>
                            Google
                        </button>
                    </>
                )}

                <p className="text-center text-sm text-slate-400 mt-6">
                    Déjà un compte ?{' '}
                    <button onClick={() => navigate('/login')} className="text-[#10b981] hover:text-[#34d399] font-semibold transition-colors">Se connecter</button>
                </p>
            </div>
        </div>
    );
}