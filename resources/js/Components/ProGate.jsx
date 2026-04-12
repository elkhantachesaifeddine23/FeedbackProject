import { Link } from '@inertiajs/react';
import { Crown, Zap, ArrowRight, Check } from 'lucide-react';

const FEATURES = {
    ai_radar: {
        title: 'Radar IA',
        icon: '🧠',
        color: 'from-indigo-500 via-purple-500 to-violet-600',
        description: "Analysez automatiquement vos feedbacks grâce à l'IA pour détecter les problèmes, tendances et prendre les meilleures décisions.",
        perks: [
            'Analyse IA de tous vos avis',
            'Détection automatique des problèmes',
            'Recommandations actionnables',
            'Health Score & Benchmarks',
            'Export PDF & CSV',
        ],
    },
    tasks: {
        title: 'Gestion des Tâches',
        icon: '✅',
        color: 'from-purple-500 via-fuchsia-500 to-pink-600',
        description: "Créez et suivez des tâches directement depuis vos analyses Radar IA pour transformer chaque insight en action concrète.",
        perks: [
            'Créer des tâches depuis le Radar IA',
            'Suivi de progression en temps réel',
            'Priorité & statuts personnalisables',
            'Historique complet des actions',
        ],
    },
};

export default function ProGate({ feature, hasAccess, children }) {
    if (hasAccess) return <>{children}</>;

    const cfg = FEATURES[feature] ?? {
        title: 'Fonctionnalité Pro',
        icon: '⭐',
        color: 'from-gray-600 to-gray-800',
        description: 'Cette fonctionnalité nécessite un plan supérieur.',
        perks: [],
    };

    return (
        <div className="relative" style={{ minHeight: '72vh' }}>

            {/* ── Contenu flouté en arrière-plan ── */}
            <div
                className="pointer-events-none select-none"
                style={{ filter: 'blur(6px)', opacity: 0.35, maxHeight: '78vh', overflow: 'hidden' }}
                aria-hidden="true"
            >
                {children}
            </div>

            {/* Fondu bas */}
            <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: '220px', background: 'linear-gradient(to top, #f9fafb 25%, transparent)' }}
            />

            {/* ── Overlay centré ── */}
            <div className="absolute inset-0 flex items-start justify-center z-20 pt-16 px-4">
                <div className="w-full max-w-md">

                    {/* Card principale */}
                    <div
                        className="bg-white rounded-3xl overflow-hidden"
                        style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)' }}
                    >
                        {/* Header gradient */}
                        <div className={`bg-gradient-to-br ${cfg.color} px-8 pt-8 pb-7`}>
                            <div className="text-center">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold mb-5">
                                    <Crown className="w-3 h-3" />
                                    Plan Pro requis
                                </div>

                                {/* Icône */}
                                <div className="text-5xl mb-3 drop-shadow-lg">{cfg.icon}</div>

                                {/* Titre */}
                                <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                                    {cfg.title}
                                </h2>
                                <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
                                    {cfg.description}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-8 py-7">

                            {/* Checklist */}
                            {cfg.perks.length > 0 && (
                                <ul className="space-y-3 mb-7">
                                    {cfg.perks.map((perk) => (
                                        <li key={perk} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">{perk}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* CTA */}
                            <Link
                                href={route('billing.index')}
                                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r ${cfg.color} text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all duration-200`}
                            >
                                <Zap className="w-4 h-4" />
                                Passer au Plan Pro
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <p className="text-center mt-3 text-xs text-gray-400">
                                Accès instantané · Sans engagement · Annulable à tout moment
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
