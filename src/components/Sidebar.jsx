import React from 'react';
import { NavLink } from 'react-router-dom';

// Icônes SVG haute performance adaptées à la finance
const Icons = {
    Synthese: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    Budget: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    Patrimoine: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    Investir: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    ),
    Analyse: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Parametres: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
};

export const menuItems = [
    { path: '/synthese', name: 'Synthèse', icon: Icons.Synthese },
    { path: '/budget', name: 'Budget', icon: Icons.Budget },
    { path: '/patrimoine', name: 'Patrimoine', icon: Icons.Patrimoine },
    { path: '/investir', name: 'Investir', icon: Icons.Investir },
    { path: '/analyse', name: 'Analyse', icon: Icons.Analyse },
    { path: '/parametres', name: 'Paramètres', icon: Icons.Parametres },
];

export default function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0a1f33] fixed h-full z-20">
            {/* Zone Logo Premium */}
            <div className="h-20 flex items-center px-8 border-b border-white/5">
                <span className="text-2xl font-black tracking-widest text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    FONDORA
                </span>
            </div>

            {/* Navigation principale (Pas de <ul>/<li> pour éviter les puces parasites) */}
            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-300 ease-out group relative overflow-hidden
              ${isActive
                                ? 'text-white bg-white/5 border border-white/10 shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Ligne d'accentuation émeraude */}
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#10b981] transition-transform duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)] ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>

                                {/* Micro-effet de halo lumineux au survol */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#10b981]/0 to-[#10b981]/0 group-hover:from-[#10b981]/5 transition-all duration-500"></div>

                                <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-[#10b981]' : 'group-hover:text-white group-hover:scale-110'}`}>
                                    <item.icon />
                                </span>
                                <span className="relative z-10 tracking-wide text-sm">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}