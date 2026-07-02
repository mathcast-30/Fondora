import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, PieChart, TrendingUp, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { to: '/', label: 'Synthèse', icon: LayoutDashboard },
    { to: '/budget', label: 'Budget', icon: Wallet },
    { to: '/patrimoine', label: 'Patrimoine', icon: PieChart },
    { to: '/investir', label: 'Investir', icon: TrendingUp },
    { to: '/analyse', label: 'Analyse', icon: BarChart3 },
]

function Sidebar() {
    const { signOut, user } = useAuth()

    return (
        <aside className="w-64 bg-navy h-screen flex flex-col fixed left-0 top-0 border-r border-navy-light">
            {/* Logo */}
            <div className="px-6 py-6">
                <h1 className="text-emerald text-2xl font-bold">Fondora</h1>
            </div>

            {/* Navigation principale */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                ? 'bg-emerald text-white'
                                : 'text-gray-300 hover:bg-navy-light hover:text-white'
                            }`
                        }
                    >
                        <Icon size={20} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Bas de la sidebar : paramètres + utilisateur */}
            <div className="px-3 py-4 border-t border-navy-light space-y-1">
                <NavLink
                    to="/parametres"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                            ? 'bg-emerald text-white'
                            : 'text-gray-300 hover:bg-navy-light hover:text-white'
                        }`
                    }
                >
                    <Settings size={20} />
                    Paramètres
                </NavLink>

                <div className="px-3 py-2 text-xs text-gray-500 truncate">
                    {user?.email}
                </div>

                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-navy-light hover:text-white transition"
                >
                    <LogOut size={20} />
                    Déconnexion
                </button>
            </div>
        </aside>
    )
}

export default Sidebar