import { Link } from 'react-router-dom'

export default function MentionsLegales() {
    return (
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="min-h-screen py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="text-emerald hover:underline text-sm font-medium flex items-center gap-2 mb-8">
                    ← Retour à l'application
                </Link>
                <h1 className="text-3xl font-bold mb-2">Mentions Légales</h1>
                <p className="text-gray-400 text-sm mb-6">Version 1.0 — En vigueur depuis le 13 juillet 2026</p>
                <hr className="border-navy-light mb-8" style={{ borderColor: 'var(--border-color)' }} />
                
                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Éditeur du site</h2>
                        <p>
                            Le site <strong>Fondora</strong> (accessible à l'adresse https://fondora.vercel.app ou tout domaine associé) est édité à titre personnel par :
                        </p>
                        <p className="mt-2 font-medium text-white">
                            Mathéo Hélou<br />
                            Particulier<br />
                            Contact : fondora.dev@gmail.com
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Hébergement</h2>
                        <p>Le site est hébergé par :</p>
                        <p className="mt-2 font-medium text-white">
                            <strong>Vercel Inc.</strong><br />
                            340 Pine Street, Suite 701<br />
                            San Francisco, CA 94104 — États-Unis<br />
                            https://vercel.com
                        </p>
                        <p className="mt-4">Les données des utilisateurs sont stockées par :</p>
                        <p className="mt-2 font-medium text-white">
                            <strong>Supabase Inc.</strong><br />
                            970 Toa Payoh North, #07-04<br />
                            Singapour 318992<br />
                            https://supabase.com<br />
                            <span className="text-sm text-emerald font-normal">*(Serveurs situés en région eu-west-3 — Paris, France — conformes RGPD)*</span>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Propriété intellectuelle</h2>
                        <p>
                            L'ensemble des éléments constituant le site Fondora (code source, design, textes, logotypes) est la propriété exclusive de Mathéo Hélou, sauf mention contraire.
                        </p>
                        <p className="mt-2">
                            Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Limitation de responsabilité</h2>
                        <p>
                            Fondora est un outil d'aide à la gestion financière personnelle. Les informations et calculs fournis ont une valeur <strong>indicative uniquement</strong> et ne constituent en aucun cas un conseil financier, fiscal ou juridique au sens des réglementations en vigueur.
                        </p>
                        <p className="mt-2">
                            L'éditeur ne saurait être tenu responsable des décisions financières prises par l'utilisateur sur la base des données affichées dans l'application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Contact</h2>
                        <p>
                            Pour toute question relative au site : <a href="mailto:fondora.dev@gmail.com" className="text-emerald hover:underline">fondora.dev@gmail.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
