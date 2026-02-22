import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Luminea - Plateforme Intelligence Feedback Client" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Subtle Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-luminea-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                </div>

                {/* Header */}
                <header className="relative border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img src="/images/logo_Luminea2.png" alt="Luminea" className="h-16 w-auto" />
                            </div>

                            <nav className="flex items-center space-x-3">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="px-6 py-2.5 text-sm font-semibold text-white bg-luminea-600 hover:bg-luminea-700 rounded-lg transition-colors"
                                    >
                                        Dashboard →
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="px-6 py-2.5 text-sm font-semibold text-white bg-luminea-600 hover:bg-luminea-700 rounded-lg transition-colors"
                                        >
                                            Commencer
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
                    <div className="text-center relative z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luminea-600/10 border border-luminea-600/20 text-luminea-400 text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 7H7v6h6V7z"/><path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
                            </svg>
                            Propulsé par l'IA Gemini
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                            Gérez vos feedbacks clients
                            <span className="block mt-2 bg-gradient-to-r from-luminea-400 to-purple-400 bg-clip-text text-transparent">
                                avec l'intelligence artificielle
                            </span>
                        </h1>
                        
                        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            Collectez, analysez et répondez automatiquement aux feedbacks de vos clients. 
                            <span className="block mt-2 text-gray-500">Réponses IA multilingues • Analytics en temps réel • Multi-canaux (Email, SMS, QR)</span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="px-8 py-3.5 text-base font-semibold text-white bg-luminea-600 hover:bg-luminea-700 rounded-lg transition-colors shadow-lg shadow-luminea-600/20"
                                >
                                    Accéder au dashboard →
                                    <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="group w-full sm:w-auto px-10 py-5 text-lg font-bold text-slate-900 bg-gradient-to-r from-luminea-400 to-purple-400 rounded-2xl shadow-2xl shadow-luminea-500/50 hover:shadow-luminea-400/70 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Démarrer gratuitement
                                        <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="w-full sm:w-auto px-10 py-5 text-lg font-semibold text-white bg-white/10 border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-luminea-400/50 backdrop-blur-sm transition-all duration-300"
                                    >
                                        Se connecter
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-luminea-300">
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Sans carte bancaire
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Configuration 2min
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                IA Intégrée
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Support Premium
                            </div>
                        </div>
                    </div>

                    {/* Floating Dashboard Preview (mockup) */}
                    <div className="mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-luminea-600/20 to-transparent blur-3xl"></div>
                        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-luminea-500/20 to-purple-500/20 border-b border-white/10 flex items-center px-6 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mt-12 aspect-video bg-gradient-to-br from-slate-900/50 to-luminea-900/50 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                                {/* Stats Grid */}
                                <div className="w-full h-full p-8">
                                    <div className="grid grid-cols-2 gap-6 h-full">
                                        {/* Stat 1 - Entreprises */}
                                        <div className="bg-gradient-to-br from-luminea-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-luminea-400/30 flex flex-col justify-between group hover:scale-105 transition-transform duration-300">
                                            <div className="flex items-start justify-between">
                                                <div className="bg-luminea-500/30 p-3 rounded-xl">
                                                    <svg className="w-8 h-8 text-luminea-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">+12%</span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-4xl font-black text-white mb-1">500+</div>
                                                <div className="text-sm text-luminea-300 font-medium">Entreprises actives</div>
                                            </div>
                                        </div>

                                        {/* Stat 2 - Feedbacks */}
                                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 flex flex-col justify-between group hover:scale-105 transition-transform duration-300">
                                            <div className="flex items-start justify-between">
                                                <div className="bg-purple-500/30 p-3 rounded-xl">
                                                    <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">+24%</span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-4xl font-black text-white mb-1">50K+</div>
                                                <div className="text-sm text-purple-300 font-medium">Feedbacks collectés</div>
                                            </div>
                                        </div>

                                        {/* Stat 3 - Taux de satisfaction */}
                                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 flex flex-col justify-between group hover:scale-105 transition-transform duration-300">
                                            <div className="flex items-start justify-between">
                                                <div className="bg-blue-500/30 p-3 rounded-xl">
                                                    <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">+5%</span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-4xl font-black text-white mb-1">96%</div>
                                                <div className="text-sm text-blue-300 font-medium">Taux de satisfaction</div>
                                            </div>
                                        </div>

                                        {/* Stat 4 - Temps de réponse IA */}
                                        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30 flex flex-col justify-between group hover:scale-105 transition-transform duration-300">
                                            <div className="flex items-start justify-between">
                                                <div className="bg-emerald-500/30 p-3 rounded-xl">
                                                    <svg className="w-8 h-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded-full">⚡ Rapide</span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-4xl font-black text-white mb-1">&lt;2s</div>
                                                <div className="text-sm text-emerald-300 font-medium">Réponse IA moyenne</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                    <div className="text-center mb-20 relative z-10">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
                            Des fonctionnalités
                            <span className="block bg-gradient-to-r from-luminea-400 to-purple-400 bg-clip-text text-transparent">
                                qui font la différence
                            </span>
                        </h2>
                        <p className="text-xl text-luminea-200/80 max-w-3xl mx-auto font-light">
                            Technologie de pointe combinée à une expérience utilisateur exceptionnelle
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
                        {/* Feature 1 - IA Génératrice */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-luminea-500/0 to-purple-500/0 group-hover:from-luminea-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-luminea-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-luminea-500/50 group-hover:shadow-luminea-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    IA Génératrice de Réponses
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Intelligence artificielle avancée pour générer automatiquement des réponses personnalisées et pertinentes à vos clients.
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-luminea-300 text-sm">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Powered by Gemini AI
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Multi-canal */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50 group-hover:shadow-blue-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Communication Multi-canal
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Envoyez vos demandes de feedback par Email, SMS ou QR Code. Flexibilité totale pour toucher vos clients.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-blue-400/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-400/30">Email</span>
                                    <span className="px-3 py-1 bg-green-400/20 text-green-300 rounded-full text-xs font-semibold border border-green-400/30">SMS</span>
                                    <span className="px-3 py-1 bg-purple-400/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-400/30">QR Code</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 - Analytics */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-green-500/50 group-hover:shadow-green-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Analytics en Temps Réel
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Tableaux de bord interactifs avec statistiques détaillées, graphiques et insights pour piloter votre satisfaction client.
                                </p>
                                <div className="mt-6 text-green-300 text-sm font-medium">
                                    📊 Visualisations avancées
                                </div>
                            </div>
                        </div>

                        {/* Feature 4 - Notation 5 étoiles */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/50 group-hover:shadow-yellow-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Système de Notation Étoiles
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Interface intuitive de notation de 1 à 5 étoiles avec commentaires détaillés pour capturer l'expérience client.
                                </p>
                                <div className="mt-6 flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Feature 5 - Sécurité */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-red-500/50 group-hover:shadow-red-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Sécurité Maximale
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Tokens sécurisés, authentification 2FA pour admins, et protection CSRF pour garantir la confidentialité des données.
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-red-300 text-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Certifié sécurisé
                                </div>
                            </div>
                        </div>

                        {/* Feature 6 - Radar IA */}
                        <div className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-luminea-400/50 transition-all duration-500 hover:scale-105 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/50 group-hover:shadow-purple-400/70 transition-all duration-500 group-hover:rotate-6">
                                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Radar IA Prédictif
                                </h3>
                                <p className="text-luminea-200/80 leading-relaxed">
                                    Analyse prédictive et détection automatique des tendances pour anticiper les problèmes et opportunités.
                                </p>
                                <div className="mt-6 text-purple-300 text-sm font-medium">
                                    🎯 Insights intelligents
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                {!auth.user && (
                    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                        <div className="relative bg-gradient-to-br from-luminea-600 via-purple-600 to-pink-600 rounded-[3rem] shadow-2xl shadow-luminea-500/50 overflow-hidden border border-white/20">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-12 sm:p-20 text-center z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold mb-8">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    Offre de lancement
                                </div>

                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                                    Prêt à révolutionner
                                    <span className="block mt-2">votre feedback client ?</span>
                                </h2>
                                <p className="text-white/90 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                                    Rejoignez les entreprises innovantes qui utilisent Luminea pour transformer chaque feedback en opportunité de croissance.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Link
                                        href={route('register')}
                                        className="group w-full sm:w-auto px-10 py-5 text-lg font-bold text-luminea-600 bg-white rounded-2xl hover:bg-luminea-50 shadow-2xl hover:shadow-white/50 transition-all duration-300 flex items-center justify-center hover:scale-105"
                                    >
                                        Commencer gratuitement
                                        <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <a href="#features" className="text-white font-semibold hover:text-white/80 transition-colors">
                                        Découvrir les fonctionnalités →
                                    </a>
                                </div>
                                <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/80 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Gratuit pour toujours
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Installation 2min
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Sans engagement
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="relative border-t border-white/10 bg-gradient-to-br from-slate-900/95 to-luminea-900/95 backdrop-blur-xl mt-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                            {/* Brand Section */}
                            <div className="md:col-span-2">
                                <div className="flex items-center gap-4 mb-6">
                                    <img src="/images/logo_Luminea2.png" alt="Luminea" className="h-16 w-auto drop-shadow-2xl" />
                                </div>
                                <p className="text-luminea-200/70 max-w-md leading-relaxed mb-6">
                                    Transformez chaque feedback client en opportunité de croissance grâce à notre plateforme d'intelligence feedback propulsée par l'IA.
                                </p>
                                <div className="flex gap-4">
                                    <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    </a>
                                </div>
                            </div>

                            {/* Links Columns */}
                            <div>
                                <h3 className="font-bold text-white mb-4 text-lg">Produit</h3>
                                <ul className="space-y-3 text-luminea-200/70">
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Fonctionnalités</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Tarifs</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Intégrations</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Mises à jour</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-white mb-4 text-lg">Entreprise</h3>
                                <ul className="space-y-3 text-luminea-200/70">
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">À propos</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Blog</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Support</a></li>
                                    <li><a href="#" className="hover:text-luminea-400 transition-colors">Contact</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-luminea-200/60 text-sm text-center md:text-left">
                                    © 2026 Luminea. Tous droits réservés. Propulsé par Laravel • React • Inertia • Gemini AI
                                </p>
                                <div className="flex gap-6 text-sm text-luminea-200/60">
                                    <a href="#" className="hover:text-luminea-400 transition-colors">Confidentialité</a>
                                    <a href="#" className="hover:text-luminea-400 transition-colors">Conditions</a>
                                    <a href="#" className="hover:text-luminea-400 transition-colors">Cookies</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}