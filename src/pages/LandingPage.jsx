import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-[#0a1f33] overflow-hidden selection:bg-[#10b981] selection:text-white font-sans text-white">

            {/* FOND ANIMÉ */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#10b981]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }}></div>
            <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-blue-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '10s' }}></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* HEADER */}
                <header className="max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-sm bg-[#0a1f33]/30">
                    <div className="text-2xl font-black tracking-widest text-[#10b981] drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        FONDORA
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 font-bold text-white rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#10b981]/50 transition-all"
                    >
                        Se connecter
                    </button>
                </header>

                {/* HERO SECTION */}
                <main className="flex-grow flex flex-col justify-center items-center text-center px-6 pt-12 pb-24">
                    <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-sm font-semibold tracking-wide backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-ping"></span>
                        Votre patrimoine, réinventé
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
                        Prenez le contrôle de <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-teal-300">
                            votre avenir financier.
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl mt-6 max-w-2xl mx-auto font-light">
                        Centralisez vos comptes, optimisez vos frais et projetez vos investissements grâce à l'outil d'analyse le plus puissant et sécurisé du marché.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto px-8 py-4 bg-[#10b981] hover:bg-[#0e9f6e] text-[#0a1f33] font-black rounded-2xl transition-all transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                        >
                            Créer mon compte gratuit
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-2xl transition-all backdrop-blur-md"
                        >
                            J'ai déjà un compte
                        </button>
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#10b981]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            Données chiffrées & privées
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#10b981]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Zéro connexion bancaire requise
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}