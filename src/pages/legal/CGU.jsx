import { Link } from 'react-router-dom'

export default function Cgu() {
    return (
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="min-h-screen py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="text-emerald hover:underline text-sm font-medium flex items-center gap-2 mb-8">
                    ← Retour à l'application
                </Link>
                <h1 className="text-3xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
                <p className="text-gray-400 text-sm mb-6">Version 1.0 — En vigueur depuis le 13 juillet 2026</p>
                <hr className="border-navy-light mb-8" style={{ borderColor: 'var(--border-color)' }} />
                
                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 1 — Objet</h2>
                        <p>
                            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application <strong>Fondora</strong>, service de gestion de patrimoine personnel édité par Mathéo Hélou (ci-après « l'Éditeur »).
                        </p>
                        <p className="mt-2">
                            En créant un compte ou en utilisant l'application, l'utilisateur accepte sans réserve les présentes CGU.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 2 — Accès au service</h2>
                        <p>
                            Fondora est accessible gratuitement à toute personne disposant d'un accès à Internet. L'Éditeur se réserve le droit de modifier, suspendre ou interrompre l'accès au service à tout moment, sans préavis ni indemnité.
                        </p>
                        <p className="mt-2">
                            L'utilisation du service est réservée aux personnes majeures (18 ans et plus) ou aux mineurs disposant de l'autorisation de leur représentant légal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 3 — Inscription et compte utilisateur</h2>
                        <p>
                            L'accès aux fonctionnalités de Fondora nécessite la création d'un compte via une adresse email valide. L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.
                        </p>
                        <p className="mt-2">
                            Toute utilisation du service avec les identifiants de l'utilisateur est réputée effectuée par ce dernier. En cas de suspicion d'utilisation frauduleuse, l'utilisateur doit contacter l'Éditeur sans délai à fondora.dev@gmail.com.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 4 — Données financières</h2>
                        <p>
                            Les données financières saisies dans Fondora (comptes, transactions, investissements, etc.) sont <strong>strictement personnelles</strong>. L'Éditeur ne les utilise à aucune fin commerciale, publicitaire ou de profilage.
                        </p>
                        <p className="mt-2">
                            Fondora est un outil <strong>indicatif</strong> : les calculs, projections et analyses fournis ne constituent pas des conseils financiers, fiscaux ou juridiques. L'utilisateur reste seul responsable de ses décisions patrimoniales.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 5 — Comportement de l'utilisateur</h2>
                        <p>L'utilisateur s'engage à :</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Ne pas utiliser le service à des fins illicites ou contraires aux présentes CGU</li>
                            <li>Ne pas tenter d'accéder aux données d'autres utilisateurs</li>
                            <li>Ne pas introduire de virus, code malveillant ou tout élément susceptible de perturber le service</li>
                            <li>Fournir des informations exactes lors de son inscription</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 6 — Disponibilité du service</h2>
                        <p>
                            L'Éditeur s'efforce d'assurer la disponibilité du service mais ne garantit pas un accès ininterrompu. Des interruptions peuvent survenir pour maintenance, incidents techniques ou raisons indépendantes de la volonté de l'Éditeur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 7 — Propriété intellectuelle</h2>
                        <p>
                            L'application Fondora, son code source, son design et ses contenus sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou exploitation non autorisée est interdite.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 8 — Modification des CGU</h2>
                        <p>
                            L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle lors de leur prochaine connexion et devront accepter la nouvelle version pour continuer à utiliser le service.
                        </p>
                        <p className="mt-2">
                            La version en vigueur est toujours consultable depuis l'application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 9 — Résiliation</h2>
                        <p>
                            L'utilisateur peut supprimer son compte à tout moment depuis la page Paramètres de l'application. Cette suppression entraîne l'effacement définitif et immédiat de toutes ses données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Article 10 — Droit applicable</h2>
                        <p>
                            Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du domicile de l'Éditeur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
                        <p>
                            Pour toute question relative aux présentes CGU : <a href="mailto:fondora.dev@gmail.com" className="text-emerald hover:underline">fondora.dev@gmail.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
