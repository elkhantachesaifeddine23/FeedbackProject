import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Star, ToggleLeft, ToggleRight, Save, Search, CheckCircle, MessageSquare, Building2, UtensilsCrossed, BookOpen, Stethoscope, Scissors, Link as LinkIcon } from 'lucide-react';
import * as SimpleIcons from 'react-icons/si';

// Composant pour afficher l'icône correcte
const PlatformIcon = ({ iconName, className }) => {
    // Si c'est une icône de react-icons/si
    if (iconName.startsWith('Si')) {
        const Icon = SimpleIcons[iconName];
        // Couleurs officielles SimpleIcons
        const simpleIconColors = {
            SiGoogle: '#4285F4',
            SiFacebook: '#1877F3',
            SiTripadvisor: '#34E0A1',
            SiYelp: '#C41200',
            SiTrustpilot: '#00B67A',
            SiBookingdotcom: '#003580',
            SiAmazon: '#FF9900',
            SiInstagram: '#E4405F',
            SiGooglemaps: '#4285F4',
            SiAppstore: '#0D96F6',
            SiGoogleplay: '#34A853',
        };
        if (Icon) {
            return <Icon className={className} color={simpleIconColors[iconName] || '#1e3a8a'} />;
        }
    }

    // Si c'est une icône de lucide-react
    const lucideIcons = {
        Star,
        CheckCircle,
        MessageSquare,
        Building2,
        UtensilsCrossed,
        BookOpen,
        Stethoscope,
        Scissors,
    };

    const Icon = lucideIcons[iconName];
    if (Icon) {
        return <Icon className={className} color="#1e3a8a" />;
    }

    // Fallback
    return <Star className={className} color="#1e3a8a" />;
};

export default function Index({ auth, platforms }) {
    const [platformsState, setPlatformsState] = useState(platforms);
    const [saving, setSaving] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleToggle = (platformKey) => {
        setPlatformsState(platformsState.map(p =>
            p.key === platformKey ? { ...p, is_active: !p.is_active } : p
        ));
    };

    const handleUrlChange = (platformKey, url) => {
        setPlatformsState(platformsState.map(p =>
            p.key === platformKey ? { ...p, url } : p
        ));
    };

    const handleSave = (platform) => {
        setSaving(platform.key);

        router.post(route('review-platforms.upsert'), {
            platform_key: platform.key,
            platform_url: platform.url,
            is_active: platform.is_active,
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(null),
        });
    };

    // Filtrer les plateformes par nom
    const filteredPlatforms = platformsState.filter(platform =>
        platform.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Compter les plateformes actives
    const activePlatformsCount = platformsState.filter(p => p.is_active).length;

    return (
        <AuthenticatedLayout user={auth.user} header="Plateformes d'avis">
            <Head title="Plateformes d'avis" />

            <div className="space-y-6">
                {/* Header */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700"></div>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Star className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white mb-1">Plateformes d'avis</h1>
                                <p className="text-blue-100 text-lg">Configurez vos plateformes pour rediriger les clients satisfaits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-900 p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">Comment ça marche ?</h3>
                            <p className="text-gray-700 font-medium">
                                Lorsqu'un client laisse un feedback avec une note supérieure à 3 étoiles, 
                                il sera invité à laisser un avis sur les plateformes que vous avez activées ci-dessous.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-blue-900">{activePlatformsCount}</div>
                            <div className="text-sm text-gray-600 font-semibold">Activées</div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une plateforme (Google, Facebook, Booking...)"
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="mt-2 text-sm text-gray-600">
                            {filteredPlatforms.length} plateforme(s) trouvée(s)
                        </p>
                    )}
                </div>

                {/* Platforms Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {filteredPlatforms.length > 0 ? (
                        filteredPlatforms.map((platform) => (
                        <div
                            key={platform.key}
                            className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all ${
                                platform.is_active ? 'border-blue-900' : 'border-gray-200'
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white`}>
                                        {/* Icône colorée */}
                                        <PlatformIcon iconName={platform.icon} className="w-8 h-8" style={{ color: platform.color ?? '#1e3a8a' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{platform.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {platform.is_active ? 'Activé' : 'Désactivé'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle(platform.key)}
                                    className="focus:outline-none"
                                >
                                    {platform.is_active ? (
                                        <ToggleRight className="w-12 h-12 text-blue-900" />
                                    ) : (
                                        <ToggleLeft className="w-12 h-12 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LinkIcon className="w-4 h-4" />
                                        URL de votre page {platform.name}
                                    </div>
                                </label>
                                <input
                                    type="url"
                                    value={platform.url}
                                    onChange={(e) => handleUrlChange(platform.key, e.target.value)}
                                    placeholder={`https://...`}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                                />
                                <button
                                    onClick={() => handleSave(platform)}
                                    disabled={saving === platform.key}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-all disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving === platform.key ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    ))
                    ) : (
                        <div className="col-span-2 text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune plateforme trouvée</h3>
                            <p className="text-gray-600">Essayez de modifier votre recherche</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
