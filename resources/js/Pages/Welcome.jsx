import { Head, Link } from '@inertiajs/react';
import {
    SiGoogle,
    SiAirbnb,
    SiAmazon,
    SiFacebook,
    SiInstagram,
    SiTripadvisor,
    SiYelp,
    SiTrustpilot,
    SiGooglemaps,
    SiAppstore,
    SiGoogleplay,
} from 'react-icons/si';
import {
    siBookingdotcom,
    siGoogle,
    siAirbnb,
    siFacebook,
    siInstagram,
    siTripadvisor,
    siYelp,
    siTrustpilot,
    siGooglemaps,
    siAppstore,
    siGoogleplay,
} from 'simple-icons';

const BookingIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={siBookingdotcom.path} />
    </svg>
);

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Luminea - Plateforme SaaS de feedback client" />

            <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
                {/* Ambient lights */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-900/10 blur-3xl animate-pulse"></div>
                    <div className="absolute top-1/4 -left-40 h-[460px] w-[460px] rounded-full bg-blue-900/8 blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-gray-900/5 blur-3xl"></div>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/images/logo_Luminea2.png" alt="Luminea" className="h-20 w-auto" />
                            </div>

                            <nav className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                                    >
                                        Accéder au dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                                        >
                                            Commencer
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-900/20 text-blue-900 text-sm font-semibold bg-blue-50">
                                Plateforme SaaS • IA intégrée
                            </div>
                            <h1 className="mt-5 text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
                                L’art de transformer les feedbacks clients en avantage concurrentiel
                            </h1>
                            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                                Luminea automatise la collecte, l’analyse et la réponse. Identifiez les priorités, améliorez votre réputation en ligne et gagnez du temps avec des réponses IA parfaitement adaptées.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="px-6 py-3 text-base font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                                    >
                                        Ouvrir le dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="px-6 py-3 text-base font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                                        >
                                            Démarrer gratuitement
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="px-6 py-3 text-base font-semibold text-blue-900 border border-blue-900/30 hover:border-blue-900 rounded-lg transition-colors"
                                        >
                                            Se connecter
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-900"></span>
                                    QR code & liens publics
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-900"></span>
                                    Email & SMS automatisés
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-900"></span>
                                    Multi-plateformes d'avis
                                </div>
                            </div>

                            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                                {[
                                    {
                                        title: 'Automatisation intelligente',
                                        desc: 'Réponses IA cohérentes et adaptées à votre ton.'
                                    },
                                    {
                                        title: 'Réputation renforcée',
                                        desc: 'Redirigez les clients satisfaits vers vos plateformes.'
                                    },
                                    {
                                        title: 'Pilotage simplifié',
                                        desc: 'Centralisez la collecte et l’analyse en un seul espace.'
                                    }
                                ].map((item) => (
                                    <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                        <div className="h-1 w-10 bg-blue-900 rounded-full"></div>
                                        <div className="mt-3 text-sm font-bold text-gray-900">{item.title}</div>
                                        <div className="mt-1 text-xs text-gray-600">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -top-6 -right-6 h-20 w-20 rounded-2xl border border-blue-900/30 bg-white shadow-lg flex items-center justify-center animate-bounce">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-50 border border-blue-900/50 shadow-inner flex items-center justify-center">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-900"></span>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-500">Aperçu Luminea</div>
                                        <div className="text-lg font-bold text-gray-900">Dashboard intelligence</div>
                                    </div>
                                    <div className="text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded-full">
                                        Temps réel
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-4">
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <div className="text-xs text-gray-500">Radar IA</div>
                                        <div className="mt-2 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-50 border border-blue-900/50 shadow-inner flex items-center justify-center">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-900"></span>
                                                    </div>
                                            <div className="text-sm text-gray-600">Détection automatique des tendances et des actions prioritaires</div>
                                        </div>
                                    </div>
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <div className="text-xs text-gray-500">Réponse IA</div>
                                        <div className="mt-2 text-sm text-gray-700">
                                            “Merci pour votre retour ! Nous traitons votre demande sous 24h.”
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-900 font-semibold">
                                            <span className="h-2 w-2 rounded-full bg-blue-900 animate-pulse"></span>
                                            Générée automatiquement
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Advantages */}
                <section className="border-t border-b border-gray-200 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Avantages Luminea</h2>
                            <p className="mt-3 text-gray-600">Des bénéfices clairs, pensés pour la croissance.</p>
                        </div>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: 'Image de marque',
                                    desc: 'Réponses cohérentes et rapides pour renforcer la confiance.'
                                },
                                {
                                    title: 'Expérience client',
                                    desc: 'Parcours fluide avec QR, email et SMS.'
                                },
                                {
                                    title: 'Décision rapide',
                                    desc: 'Vue claire des tendances et des actions prioritaires.'
                                },
                                {
                                    title: 'Croissance durable',
                                    desc: 'Amélioration continue des notes et de la réputation.'
                                }
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="group relative rounded-2xl border border-blue-900/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-900/5 via-transparent to-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-blue-900/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-900/10 flex items-center justify-center">
                                            <div className="h-4 w-4 rounded-full bg-blue-900"></div>
                                        </div>
                                        <div className="text-base font-bold text-gray-900">{item.title}</div>
                                    </div>
                                    <div className="relative z-10 mt-3 text-sm text-gray-600 leading-relaxed">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="bg-gray-50 border-t border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Fonctionnalités clés</h2>
                            <p className="mt-3 text-gray-600">Une suite complète pour collecter, analyser et agir.</p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    title: 'Collecte multi-canaux',
                                    desc: 'Demandes par email, SMS ou QR code avec liens publics et formulaires personnalisés.',
                                },
                                {
                                    title: 'Réponses IA multilingues',
                                    desc: 'Générez des réponses automatiques cohérentes avec le ton de votre marque.',
                                },
                                {
                                    title: 'Plateformes d’avis',
                                    desc: 'Redirigez les clients satisfaits vers Google, Booking, Airbnb, Amazon, etc.',
                                },
                                {
                                    title: 'Analytics & Radar IA',
                                    desc: 'Tableaux de bord, tendances, alertes et recommandations d’actions.',
                                },
                                {
                                    title: 'Gestion des clients',
                                    desc: 'Import CSV propre, segmentation et historique complet des interactions.',
                                },
                                {
                                    title: 'Sécurité & conformité',
                                    desc: 'Tokens sécurisés, permissions et journalisation des actions.',
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="group relative rounded-2xl border border-blue-900/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-900/5 via-transparent to-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute -top-8 -left-8 h-20 w-20 rounded-full bg-blue-900/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10">
                                        <div className="h-2 w-10 bg-blue-900 rounded-full"></div>
                                        <h3 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h3>
                                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-900">
                                            <span className="h-2 w-2 rounded-full bg-blue-900"></span>
                                            Premium ready
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Platforms strip */}
                <section className="bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center text-sm text-gray-500">Intégrez vos plateformes d’avis préférées</div>

                        <div className="mt-8 relative overflow-hidden">
                            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
                            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10"></div>

                            <div className="marquee-track flex items-center gap-8">
                                {[
                                    { Icon: SiGoogle, name: 'Google', color: `#${siGoogle.hex}` },
                                    { Icon: BookingIcon, name: 'Booking.com', color: `#${siBookingdotcom.hex}` },
                                    { Icon: SiAirbnb, name: 'Airbnb', color: `#${siAirbnb.hex}` },
                                    { Icon: SiAmazon, name: 'Amazon', color: '#FF9900' },
                                    { Icon: SiFacebook, name: 'Facebook', color: `#${siFacebook.hex}` },
                                    { Icon: SiInstagram, name: 'Instagram', color: `#${siInstagram.hex}` },
                                    { Icon: SiTripadvisor, name: 'TripAdvisor', color: `#${siTripadvisor.hex}` },
                                    { Icon: SiYelp, name: 'Yelp', color: `#${siYelp.hex}` },
                                    { Icon: SiTrustpilot, name: 'Trustpilot', color: `#${siTrustpilot.hex}` },
                                    { Icon: SiGooglemaps, name: 'Google Maps', color: `#${siGooglemaps.hex}` },
                                    { Icon: SiAppstore, name: 'App Store', color: `#${siAppstore.hex}` },
                                    { Icon: SiGoogleplay, name: 'Google Play', color: `#${siGoogleplay.hex}` },
                                ].map((item, idx) => (
                                    <div key={`logo-a-${item.name}-${idx}`} className="logo-card">
                                        <item.Icon style={{ color: item.color }} />
                                        <span className="sr-only">{item.name}</span>
                                    </div>
                                ))}

                                {[
                                    { Icon: SiGoogle, name: 'Google', color: `#${siGoogle.hex}` },
                                    { Icon: BookingIcon, name: 'Booking.com', color: `#${siBookingdotcom.hex}` },
                                    { Icon: SiAirbnb, name: 'Airbnb', color: `#${siAirbnb.hex}` },
                                    { Icon: SiAmazon, name: 'Amazon', color: '#FF9900' },
                                    { Icon: SiFacebook, name: 'Facebook', color: `#${siFacebook.hex}` },
                                    { Icon: SiInstagram, name: 'Instagram', color: `#${siInstagram.hex}` },
                                    { Icon: SiTripadvisor, name: 'TripAdvisor', color: `#${siTripadvisor.hex}` },
                                    { Icon: SiYelp, name: 'Yelp', color: `#${siYelp.hex}` },
                                    { Icon: SiTrustpilot, name: 'Trustpilot', color: `#${siTrustpilot.hex}` },
                                    { Icon: SiGooglemaps, name: 'Google Maps', color: `#${siGooglemaps.hex}` },
                                    { Icon: SiAppstore, name: 'App Store', color: `#${siAppstore.hex}` },
                                    { Icon: SiGoogleplay, name: 'Google Play', color: `#${siGoogleplay.hex}` },
                                ].map((item, idx) => (
                                    <div key={`logo-b-${item.name}-${idx}`} className="logo-card">
                                        <item.Icon style={{ color: item.color }} />
                                        <span className="sr-only">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Steps */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Collectez', desc: 'Créez vos demandes et partagez par email, SMS ou QR.' },
                            { step: '02', title: 'Analysez', desc: 'L’IA résume, détecte les signaux et priorise les actions.' },
                            { step: '03', title: 'Agissez', desc: 'Répondez vite et améliorez votre réputation en ligne.' },
                        ].map((item) => (
                            <div key={item.step} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm transition-all hover:shadow-md">
                                <div className="text-blue-900 text-sm font-bold">{item.step}</div>
                                <div className="mt-3 text-xl font-black text-gray-900">{item.title}</div>
                                <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Testimonials */}
                <section className="bg-gray-50 border-t border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Ils utilisent Luminea</h2>
                            <p className="mt-3 text-gray-600">Des équipes qui veulent des avis clairs et actionnables.</p>
                        </div>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    quote: '“Nous avons réduit le temps de réponse de 70% tout en améliorant la satisfaction.”',
                                    name: 'Claire M.',
                                    role: 'Responsable CX',
                                },
                                {
                                    quote: '“Le Radar IA nous a aidés à prioriser les vraies urgences.”',
                                    name: 'Yassine B.',
                                    role: 'Directeur Opérations',
                                },
                                {
                                    quote: '“Les redirections vers les plateformes d’avis ont boosté nos notes.”',
                                    name: 'Nadia K.',
                                    role: 'Marketing Manager',
                                },
                            ].map((t) => (
                                <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="text-sm text-gray-600">{t.quote}</div>
                                    <div className="mt-4 text-sm font-bold text-gray-900">{t.name}</div>
                                    <div className="text-xs text-gray-500">{t.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Questions fréquentes</h2>
                        <p className="mt-3 text-gray-600">Tout ce qu’il faut savoir pour commencer.</p>
                    </div>
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                q: 'Puis‑je personnaliser les demandes de feedback ?',
                                a: 'Oui, vous pouvez modifier le design, le texte et les canaux d’envoi.',
                            },
                            {
                                q: 'Comment fonctionne la redirection vers les plateformes d’avis ?',
                                a: 'Vous activez vos plateformes et ajoutez vos URLs. Les clients satisfaits y sont redirigés.',
                            },
                            {
                                q: 'Les réponses IA sont‑elles multilingues ?',
                                a: 'Oui, la langue est détectée et l’IA répond automatiquement.',
                            },
                            {
                                q: 'Puis‑je exporter mes rapports ?',
                                a: 'Oui, export CSV ou PDF depuis le Radar IA.',
                            },
                        ].map((item) => (
                            <div key={item.q} className="border border-gray-200 rounded-2xl p-6 bg-white">
                                <div className="text-base font-bold text-gray-900">{item.q}</div>
                                <div className="mt-2 text-sm text-gray-600">{item.a}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                {!auth.user && (
                    <section className="bg-blue-900">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                <div>
                                    <h3 className="text-3xl font-black text-white">Prêt à passer au niveau supérieur ?</h3>
                                    <p className="mt-2 text-blue-100">Créez votre espace en 2 minutes et commencez à collecter des avis.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route('register')}
                                        className="px-6 py-3 text-base font-semibold text-blue-900 bg-white rounded-lg"
                                    >
                                        Créer mon compte
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="px-6 py-3 text-base font-semibold text-white border border-white/30 rounded-lg"
                                    >
                                        Connexion
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t border-gray-200 py-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/images/logo_Luminea2.png" alt="Luminea" className="h-12 w-auto" />
                        </div>
                        <div className="text-xs text-gray-500">© 2026 Luminea. Tous droits réservés.</div>
                    </div>
                </footer>
            </div>

            <style>{`
                .marquee-track {
                    width: max-content;
                    animation: marquee 24s linear infinite;
                }

                .logo-card {
                    height: 56px;
                    width: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    border-radius: 16px;
                    background: #ffffff;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
                }

                .logo-card svg {
                    width: 28px;
                    height: 28px;
                }

                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </>
    );
}
