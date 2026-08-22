import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Sidebar, { menuItems } from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { useIncognito } from '../context/IncognitoContext';
import { useEntites } from '../hooks/useEntites';
import { useEntiteFiltre } from '../context/EntiteContext';
import { useFoyerActif } from '../context/FoyerContext';
import { LogOut, HelpCircle } from 'lucide-react';
import AideModal from './AideModal';

export default function Layout({ children }) {
    const { profile, user, signOut } = useAuth();
    const { incognito, toggleIncognito } = useIncognito();
    const { entites } = useEntites();
    const { entiteFiltre, setEntiteFiltre } = useEntiteFiltre();
    const { espaces, espaceActif, setEspaceActifId } = useFoyerActif();
    const location = useLocation();

    const [menuOuvert, setMenuOuvert] = useState(false);
    const [aideOuverte, setAideOuverte] = useState(false);
    const [espaceMenuOuvert, setEspaceMenuOuvert] = useState(false);
    const menuRef = useRef(null);
    const espaceMenuRef = useRef(null);

    const currentMenu = menuItems.find(item => location.pathname.includes(item.path)) || menuItems[0];

    // Fermer le menu déroulant au clic en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOuvert(false);
            if (espaceMenuRef.current && !espaceMenuRef.current.contains(event.target)) setEspaceMenuOuvert(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative min-h-screen bg-page text-white flex flex-col font-sans overflow-x-hidden">

            {/* Grille de fond subtile style SaaS */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Barre latérale desktop */}
            <Sidebar />

            {/* Contenu principal décalé de la largeur de la sidebar (pl-64) uniquement sur grand écran */}
            <div className="flex-1 flex flex-col min-h-screen md:pl-64 relative z-10">

                {/* Header avec bouton incognito */}
                <header className="h-16 md:h-20 flex items-center justify-between px-6 md:px-8 border-b border-[var(--border)] bg-surface/30 backdrop-blur-md sticky top-0 z-30">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        {currentMenu.name}
                        <button
                            onClick={() => setAideOuverte(true)}
                            className="text-slate-500 hover:text-[#10b981] transition-colors"
                            title="Aide de cette page"
                        >
                            <HelpCircle size={18} />
                        </button>
                    </h1>

                    <div className="flex items-center gap-3">
                        {espaces.length > 1 && (
                            <div className="relative" ref={espaceMenuRef}>
                                <button onClick={() => setEspaceMenuOuvert(v => !v)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white transition">
                                    🏠 {espaceActif?.label || 'Mon espace'} <span className="text-[9px]">▼</span>
                                </button>
                                {espaceMenuOuvert && (
                                    <div className="absolute left-0 mt-2 w-52 bg-surface border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-40">
                                        {espaces.map(e => (
                                            <button key={e.ownerUserId}
                                                onClick={() => { setEspaceActifId(e.estMoi ? null : e.ownerUserId); setEspaceMenuOuvert(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition ${espaceActif?.ownerUserId === e.ownerUserId ? 'text-[#10b981] bg-white/5' : 'text-slate-300 hover:bg-white/5'}`}>
                                                {e.estMoi ? '👤 ' : '🏠 '}{e.label}
                                                {!e.estMoi && <span className="block text-[10px] text-slate-500">Accès : {e.niveauAcces}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {entites.length > 0 && (
                            <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 mx-2 overflow-x-auto">
                                <button type="button" onClick={() => setEntiteFiltre(null)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${!entiteFiltre ? 'bg-[#10b981] text-white' : 'text-slate-400 hover:text-white'}`}>
                                    Tous
                                </button>
                                {entites.map(e => (
                                    <button type="button" key={e.id} onClick={() => setEntiteFiltre(e.id)}
                                        className="px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap"
                                        style={entiteFiltre === e.id ? { backgroundColor: e.couleur, color: '#fff' } : { color: '#94a3b8' }}>
                                        {e.nom}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleIncognito}
                            className={`p-2 rounded-full transition-all duration-300 border ${incognito
                                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            title="Mode Confidentiel"
                        >
                            {incognito ? "🙈 Caché" : "👁️ Visible"}
                        </button>

                        {/* Avatar cliquable → menu déroulant avec déconnexion */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOuvert((v) => !v)}
                                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-blue-500 p-[1.5px] cursor-pointer"
                            >
                                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-xs font-bold uppercase">
                                    {profile?.prenom?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </div>
                            </button>

                            {menuOuvert && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-40">
                                    <div className="px-4 py-3 border-b border-[var(--border)]">
                                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={signOut}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                                    >
                                        <LogOut size={16} />
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Zone centrale de la page */}
                <main className="flex-1 p-6 md:p-8 flex flex-col justify-between pb-24 md:pb-8">
                    <div className="w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>

            {/* Barre de navigation basse pour mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-page/90 backdrop-blur-xl z-50 py-2">
                <div className="flex justify-around items-center h-12">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full space-y-1 ${isActive ? 'text-[#10b981]' : 'text-slate-500'}`
                            }
                        >
                            <item.icon />
                            <span className="text-[9px] font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <AideModal
                isOpen={aideOuverte}
                onClose={() => setAideOuverte(false)}
                route={currentMenu.path}
            />

        </div>
    );
}