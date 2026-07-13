import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer 
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} 
            className="w-full text-center py-4 mt-8 border-t border-navy-light/10"
        >
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <Link to="/mentions-legales" className="hover:underline hover:text-emerald transition">
                    Mentions légales
                </Link>
                <span>|</span>
                <Link to="/cgu" className="hover:underline hover:text-emerald transition">
                    CGU
                </Link>
                <span>|</span>
                <Link to="/politique-confidentialite" className="hover:underline hover:text-emerald transition">
                    Politique de confidentialité
                </Link>
                <span>|</span>
                <Link to="/export-donnees" className="hover:underline hover:text-emerald transition">
                    Mes données
                </Link>
            </div>
        </footer>
    )
}
