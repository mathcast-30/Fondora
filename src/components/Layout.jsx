import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Sidebar, { menuItems } from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

// Petite icône d'œil pour le Mode Incognito et recherche
const LayoutIcons = {
    Eye: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    EyeOff: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0l1.414 1.414m12.022 12.022l1.414 1.414m-1.414-1.414l-3.29-3.29M8.5 8.5l.707.707" />
        </svg>
    )
};

export default function Layout({ children }) {
    // Récupération de l'état incognito depuis ton AuthContext existant
    const { isIncognito, toggleIncognito, profile } = useAuth();
    const location = useLocation();

    // On trouve la page en cours pour l'afficher dans le header
    const currentMenu = menuItems.find(item => location.pathname.includes(item.path)) || menuItems[0];

    return (
        <div className="relative min-h-screen bg-[#071321] text-white flex flex-col font-sans overflow-x-hidden">

            {/* --- EFFETS DE LUMIÈRE PREMIUM EN ARRIÈRE-PLAN --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#10b981]/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

            {/* --- DESKTOP SIDEBAR (Fixe sur le côté gauche) --- */}
            <Sidebar />

            {/* --- ZONE PRINCIPALE (Ajustée dynamiquement à ml-64 / pl-64 sur desktop) --- */}
            <div className="flex-1 flex flex-col min-h-screen md:pl-64 relative z-10">

                {/* --- DOCK DE NAVIGATION SUPÉRIEUR (Header) --- */}
                <header className="h-16 md:h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-[#0a1f33]/30 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                            {currentMenu.name}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Bouton Mode Incognito (Sécurise les montants des regards indiscrets) */}
                        <button
                            onClick={toggleIncognito}
                            className={`p-2 rounded-full transition-all duration-300 border ${isIncognito
                                    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            title="Mode Confidentiel"
                        >
                            {isIncognito ? <LayoutIcons.EyeOff /> : <LayoutIcons.Eye />}
                        </button>

                        {/* Avatar utilisateur */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-blue-500 p-[1.5px] cursor-pointer">
                            <div className="w-full h-full rounded-full bg-[#0a1f33] border border-[#0a1f33] flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden">
                                {profile?.prenom?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- CONTENU DE LA PAGE --- */}
                <main className="flex-1 p-4 md:p-8 flex flex-col justify-between pb-24 md:pb-8">
                    <div className="w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>

            {/* --- NAVIGATION BASSE MOBILE (Uniquement sur smartphones) --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#071321]/80 backdrop-blur-xl z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300
                ${isActive ? 'text-[#10b981]' : 'text-slate-500 hover:text-slate-300'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`}>
                                        <item.icon />
                                    </span>
                                    <span className={`text-[9px] font-medium transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                                        {item.name}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

        </div>
    );
}