import { useState, useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    Palette, Upload, Eye, Star, Monitor, Smartphone, 
    Check, ChevronRight, Type, Sparkles, Image, 
    MousePointerClick, X, RotateCcw, Sun, Moon, 
    Layout, Paintbrush, MessageSquare, Zap, Crown,
    CheckCircle2, Circle
} from 'lucide-react';

// ─── Thèmes prédéfinis ────────────────────────────────────────
const PRESET_THEMES = [
    {
        id: 'minimal-light',
        name: 'Minimal Light',
        description: 'Propre et épuré',
        category: 'Minimal',
        preview: 'bg-white',
        settings: {
            primary_color: '#111827',
            secondary_color: '#6B7280',
            star_style: 'modern',
            star_color: '#111827',
            font_family: 'Inter',
            background_color: '#ffffff',
            card_background: '#ffffff',
            text_color: '#111827',
            button_style: 'rounded',
        }
    },
    {
        id: 'ocean-blue',
        name: 'Ocean Blue',
        description: 'Professionnel et confiant',
        category: 'Business',
        preview: 'bg-blue-50',
        settings: {
            primary_color: '#2563EB',
            secondary_color: '#1E40AF',
            star_style: 'classic',
            star_color: '#F59E0B',
            font_family: 'Inter',
            background_color: '#EFF6FF',
            card_background: '#ffffff',
            text_color: '#1E3A5F',
            button_style: 'rounded',
        }
    },
    {
        id: 'emerald-fresh',
        name: 'Emerald Fresh',
        description: 'Naturel et accueillant',
        category: 'Nature',
        preview: 'bg-emerald-50',
        settings: {
            primary_color: '#059669',
            secondary_color: '#047857',
            star_style: 'classic',
            star_color: '#F59E0B',
            font_family: 'Poppins',
            background_color: '#ECFDF5',
            card_background: '#ffffff',
            text_color: '#064E3B',
            button_style: 'pill',
        }
    },
    {
        id: 'sunset-warm',
        name: 'Sunset Warm',
        description: 'Chaleureux et énergique',
        category: 'Créatif',
        preview: 'bg-orange-50',
        settings: {
            primary_color: '#EA580C',
            secondary_color: '#C2410C',
            star_style: 'heart',
            star_color: '#EF4444',
            font_family: 'Montserrat',
            background_color: '#FFF7ED',
            card_background: '#ffffff',
            text_color: '#431407',
            button_style: 'pill',
        }
    },
    {
        id: 'royal-purple',
        name: 'Royal Purple',
        description: 'Élégant et premium',
        category: 'Premium',
        preview: 'bg-purple-50',
        settings: {
            primary_color: '#7C3AED',
            secondary_color: '#6D28D9',
            star_style: 'modern',
            star_color: '#A78BFA',
            font_family: 'Montserrat',
            background_color: '#FAF5FF',
            card_background: '#ffffff',
            text_color: '#3B0764',
            button_style: 'rounded',
        }
    },
    {
        id: 'dark-mode',
        name: 'Dark Mode',
        description: 'Moderne et immersif',
        category: 'Dark',
        preview: 'bg-gray-900',
        settings: {
            primary_color: '#818CF8',
            secondary_color: '#6366F1',
            star_style: 'modern',
            star_color: '#FBBF24',
            font_family: 'Inter',
            background_color: '#0F172A',
            card_background: '#1E293B',
            text_color: '#F1F5F9',
            button_style: 'rounded',
        }
    },
    {
        id: 'rose-soft',
        name: 'Rose Soft',
        description: 'Doux et attentionné',
        category: 'Beauté',
        preview: 'bg-rose-50',
        settings: {
            primary_color: '#E11D48',
            secondary_color: '#BE123C',
            star_style: 'heart',
            star_color: '#FB7185',
            font_family: 'Poppins',
            background_color: '#FFF1F2',
            card_background: '#ffffff',
            text_color: '#4C0519',
            button_style: 'pill',
        }
    },
    {
        id: 'corporate-slate',
        name: 'Corporate Slate',
        description: 'Sérieux et fiable',
        category: 'Business',
        preview: 'bg-slate-50',
        settings: {
            primary_color: '#334155',
            secondary_color: '#1E293B',
            star_style: 'classic',
            star_color: '#F59E0B',
            font_family: 'Open Sans',
            background_color: '#F8FAFC',
            card_background: '#ffffff',
            text_color: '#0F172A',
            button_style: 'rounded',
        }
    },
];

const STAR_ICONS = {
    classic: { icon: '⭐', label: 'Classique' },
    modern: { icon: '★', label: 'Moderne' },
    heart: { icon: '❤️', label: 'Cœur' },
    thumbs: { icon: '👍', label: 'Pouce' },
};

const BUTTON_STYLES = {
    rounded: { class: 'rounded-xl', label: 'Arrondi' },
    square: { class: 'rounded-none', label: 'Carré' },
    pill: { class: 'rounded-full', label: 'Pilule' },
};

const FONTS = [
    { value: 'Inter', label: 'Inter', sample: 'Aa' },
    { value: 'Roboto', label: 'Roboto', sample: 'Aa' },
    { value: 'Poppins', label: 'Poppins', sample: 'Aa' },
    { value: 'Montserrat', label: 'Montserrat', sample: 'Aa' },
    { value: 'Open Sans', label: 'Open Sans', sample: 'Aa' },
];

// ─── Composant principal ──────────────────────────────────────
export default function Edit({ auth, company }) {
    const [activeTab, setActiveTab] = useState('themes');
    const [previewDevice, setPreviewDevice] = useState('mobile');
    const [logoPreview, setLogoPreview] = useState(company.logo_url ? `/storage/${company.logo_url}` : null);
    const [previewRating, setPreviewRating] = useState(4);
    const [savedNotif, setSavedNotif] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState(null);

    const { data, setData, post, processing, errors, progress } = useForm({
        logo: null,
        design_settings: company.design_settings,
    });

    const updateSetting = (key, value) => {
        setData('design_settings', {
            ...data.design_settings,
            [key]: value,
        });
        setSelectedThemeId(null); // Custom mode
    };

    const applyTheme = (theme) => {
        setSelectedThemeId(theme.id);
        setData('design_settings', {
            ...data.design_settings,
            ...theme.settings,
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setData('logo', null);
        setLogoPreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('feedback.design.update'), {
            forceFormData: true,
            onSuccess: () => {
                setSavedNotif(true);
                setTimeout(() => setSavedNotif(false), 3000);
            },
        });
    };

    const tabs = [
        { id: 'themes', label: 'Thèmes', icon: Layout },
        { id: 'colors', label: 'Couleurs', icon: Paintbrush },
        { id: 'typography', label: 'Typographie', icon: Type },
        { id: 'elements', label: 'Éléments', icon: MousePointerClick },
        { id: 'branding', label: 'Branding', icon: Image },
    ];

    return (
        <AuthenticatedLayout user={auth.user} header="Design Feedback">
            <Head title="Design Feedback" />

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900"></div>
                        <div className="absolute inset-0">
                            <div className="absolute -top-24 -right-24 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"></div>
                        </div>
                        <div className="relative px-8 py-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
                                        <Palette className="w-6 h-6 text-purple-300" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-tight">Personnalisation</h1>
                                        <p className="text-purple-300 text-sm mt-0.5">Créez une expérience de feedback unique pour vos clients</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {savedNotif && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-sm font-medium animate-pulse">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Enregistré !
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-purple-900 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-xl disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-900 rounded-full animate-spin"></div>
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Left Panel - Controls */}
                        <div className="xl:col-span-5 space-y-4">
                            {/* Tabs Navigation */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="flex border-b border-gray-100 overflow-x-auto">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                                                    activeTab === tab.id
                                                        ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-5">
                                    {/* ─── Tab: Thèmes ─── */}
                                    {activeTab === 'themes' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Thèmes prédéfinis</h3>
                                                <p className="text-xs text-gray-500 mb-4">Choisissez un thème comme point de départ, puis personnalisez-le</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {PRESET_THEMES.map((theme) => {
                                                    const isActive = selectedThemeId === theme.id;
                                                    const isDark = theme.id === 'dark-mode';
                                                    return (
                                                        <button
                                                            key={theme.id}
                                                            type="button"
                                                            onClick={() => applyTheme(theme)}
                                                            className={`relative text-left p-3 rounded-xl border-2 transition-all hover:shadow-md group ${
                                                                isActive
                                                                    ? 'border-purple-500 ring-2 ring-purple-100 shadow-sm'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                                                    <Check className="w-3 h-3 text-white" />
                                                                </div>
                                                            )}
                                                            {/* Mini preview */}
                                                            <div 
                                                                className="h-16 rounded-lg mb-2 flex items-center justify-center overflow-hidden"
                                                                style={{ backgroundColor: theme.settings.background_color }}
                                                            >
                                                                <div 
                                                                    className="w-3/4 h-10 rounded shadow-sm flex items-center justify-center"
                                                                    style={{ backgroundColor: theme.settings.card_background }}
                                                                >
                                                                    <div className="flex gap-0.5">
                                                                        {[1,2,3,4,5].map(i => (
                                                                            <span key={i} className="text-[10px]" style={{ color: theme.settings.star_color }}>
                                                                                {STAR_ICONS[theme.settings.star_style].icon}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-gray-900">{theme.name}</h4>
                                                                <p className="text-[10px] text-gray-500">{theme.description}</p>
                                                            </div>
                                                            <span className="inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                                {theme.category}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {selectedThemeId === null && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                                    <Paintbrush className="w-3.5 h-3.5 flex-shrink-0" />
                                                    Mode personnalisé — Vos couleurs ne correspondent à aucun thème
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ─── Tab: Couleurs ─── */}
                                    {activeTab === 'colors' && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Palette de couleurs</h3>
                                                <p className="text-xs text-gray-500 mb-4">Définissez les couleurs de votre page de feedback</p>
                                            </div>

                                            <ColorPicker 
                                                label="Couleur principale" 
                                                description="Boutons et accents"
                                                value={data.design_settings.primary_color} 
                                                onChange={(v) => updateSetting('primary_color', v)} 
                                            />
                                            <ColorPicker 
                                                label="Couleur secondaire" 
                                                description="Textes secondaires"
                                                value={data.design_settings.secondary_color} 
                                                onChange={(v) => updateSetting('secondary_color', v)} 
                                            />
                                            <ColorPicker 
                                                label="Couleur des étoiles" 
                                                description="Notation"
                                                value={data.design_settings.star_color} 
                                                onChange={(v) => updateSetting('star_color', v)} 
                                            />

                                            <div className="border-t border-gray-100 pt-4">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Arrière-plan</p>
                                                <div className="space-y-4">
                                                    <ColorPicker 
                                                        label="Fond de page" 
                                                        value={data.design_settings.background_color} 
                                                        onChange={(v) => updateSetting('background_color', v)} 
                                                    />
                                                    <ColorPicker 
                                                        label="Fond de la carte" 
                                                        value={data.design_settings.card_background} 
                                                        onChange={(v) => updateSetting('card_background', v)} 
                                                    />
                                                    <ColorPicker 
                                                        label="Couleur du texte" 
                                                        value={data.design_settings.text_color} 
                                                        onChange={(v) => updateSetting('text_color', v)} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── Tab: Typographie ─── */}
                                    {activeTab === 'typography' && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Police de caractères</h3>
                                                <p className="text-xs text-gray-500 mb-4">Choisissez la typographie de votre formulaire</p>
                                            </div>

                                            <div className="space-y-2">
                                                {FONTS.map((font) => (
                                                    <button
                                                        key={font.value}
                                                        type="button"
                                                        onClick={() => updateSetting('font_family', font.value)}
                                                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                                                            data.design_settings.font_family === font.value
                                                                ? 'border-purple-500 bg-purple-50/50'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                                                                    data.design_settings.font_family === font.value
                                                                        ? 'bg-purple-100 text-purple-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}
                                                                style={{ fontFamily: font.value }}
                                                            >
                                                                {font.sample}
                                                            </div>
                                                            <div className="text-left">
                                                                <span className="block text-sm font-semibold text-gray-900" style={{ fontFamily: font.value }}>
                                                                    {font.label}
                                                                </span>
                                                                <span className="block text-xs text-gray-500" style={{ fontFamily: font.value }}>
                                                                    Votre avis compte pour nous
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {data.design_settings.font_family === font.value && (
                                                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Message d'accueil */}
                                            <div className="border-t border-gray-100 pt-4">
                                                <label className="block text-sm font-medium text-gray-900 mb-1.5">Message d'accueil</label>
                                                <p className="text-xs text-gray-500 mb-2">Le titre affiché en haut de votre formulaire</p>
                                                <input
                                                    type="text"
                                                    value={data.design_settings.custom_message}
                                                    onChange={(e) => updateSetting('custom_message', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                                    placeholder="Votre avis compte pour nous!"
                                                    maxLength={100}
                                                />
                                                <p className="text-xs text-gray-400 mt-1 text-right">
                                                    {data.design_settings.custom_message?.length || 0}/100
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── Tab: Éléments ─── */}
                                    {activeTab === 'elements' && (
                                        <div className="space-y-5">
                                            {/* Style d'étoiles */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Style de notation</h3>
                                                <p className="text-xs text-gray-500 mb-3">Choisissez le style des icônes de notation</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(STAR_ICONS).map(([key, { icon, label }]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateSetting('star_style', key)}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                                data.design_settings.star_style === key
                                                                    ? 'border-purple-500 bg-purple-50/50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <span className="text-2xl">{icon}</span>
                                                            <span className="text-sm font-medium text-gray-700">{label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Style de bouton */}
                                            <div className="border-t border-gray-100 pt-4">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Style du bouton</h3>
                                                <p className="text-xs text-gray-500 mb-3">Choisissez la forme du bouton d'envoi</p>
                                                <div className="space-y-2">
                                                    {Object.entries(BUTTON_STYLES).map(([key, { class: cls, label }]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateSetting('button_style', key)}
                                                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                                                data.design_settings.button_style === key
                                                                    ? 'border-purple-500 bg-purple-50/50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div 
                                                                    className={`w-20 h-8 ${cls} flex items-center justify-center text-xs font-medium text-white`}
                                                                    style={{ backgroundColor: data.design_settings.primary_color }}
                                                                >
                                                                    Envoyer
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                                            </div>
                                                            {data.design_settings.button_style === key ? (
                                                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-gray-300" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── Tab: Branding ─── */}
                                    {activeTab === 'branding' && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Logo de l'entreprise</h3>
                                                <p className="text-xs text-gray-500 mb-4">Ajoutez votre logo pour renforcer votre marque</p>
                                            </div>

                                            {/* Logo Upload */}
                                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                                                {logoPreview ? (
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="relative">
                                                            <img 
                                                                src={logoPreview} 
                                                                alt="Logo" 
                                                                className="h-20 object-contain rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={removeLogo}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <label className="cursor-pointer text-sm text-purple-600 font-medium hover:text-purple-700">
                                                            Changer le logo
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleLogoChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center gap-2">
                                                        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                                                            <Upload className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">Glissez ou cliquez pour uploader</span>
                                                        <span className="text-xs text-gray-500">PNG, JPG, SVG — Max 2 Mo</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                                {errors.logo && <p className="text-red-500 text-xs mt-2 text-center">{errors.logo}</p>}
                                            </div>

                                            {/* Toggle afficher logo */}
                                            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Image className="w-4 h-4 text-gray-500" />
                                                    <div>
                                                        <span className="block text-sm font-medium text-gray-900">Afficher le logo</span>
                                                        <span className="block text-xs text-gray-500">Visible en haut du formulaire</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.design_settings.show_logo}
                                                        onChange={(e) => updateSetting('show_logo', e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-11 h-6 rounded-full transition-colors ${data.design_settings.show_logo ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform mt-0.5 ${data.design_settings.show_logo ? 'translate-x-5.5 ml-[22px]' : 'translate-x-0.5 ml-[2px]'}`}></div>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Live Preview */}
                        <div className="xl:col-span-7">
                            <div className="sticky top-4">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Preview Header */}
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Aperçu en direct</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewDevice('mobile')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                    previewDevice === 'mobile'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Smartphone className="w-3.5 h-3.5" />
                                                Mobile
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewDevice('desktop')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                    previewDevice === 'desktop'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Monitor className="w-3.5 h-3.5" />
                                                Desktop
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Content */}
                                    <div className="flex items-center justify-center p-8 bg-[#f0f0f0] min-h-[700px]">
                                        <div 
                                            className={`transition-all duration-300 ${
                                                previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'
                                            }`}
                                        >
                                            {/* Device Frame */}
                                            <div className={`${previewDevice === 'mobile' ? 'rounded-[2.5rem] ring-[8px] ring-gray-800 overflow-hidden shadow-2xl' : 'rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-200'}`}>
                                                {/* Status bar (mobile) */}
                                                {previewDevice === 'mobile' && (
                                                    <div className="bg-gray-800 h-7 flex items-center justify-center">
                                                        <div className="w-20 h-4 bg-gray-900 rounded-full"></div>
                                                    </div>
                                                )}

                                                {/* Actual Preview */}
                                                <div 
                                                    className="min-h-[550px] flex items-center justify-center p-6"
                                                    style={{ 
                                                        backgroundColor: data.design_settings.background_color,
                                                        fontFamily: data.design_settings.font_family 
                                                    }}
                                                >
                                                    <div 
                                                        className={`w-full ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-md'} shadow-xl p-7`}
                                                        style={{ 
                                                            backgroundColor: data.design_settings.card_background,
                                                            color: data.design_settings.text_color,
                                                            borderRadius: data.design_settings.button_style === 'square' ? '0' : '1rem'
                                                        }}
                                                    >
                                                        {/* Logo */}
                                                        {data.design_settings.show_logo && logoPreview && (
                                                            <div className="flex justify-center mb-5">
                                                                <img 
                                                                    src={logoPreview} 
                                                                    alt={company.name}
                                                                    className="h-12 object-contain"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Title */}
                                                        <h1 className="text-xl font-bold mb-1 text-center" style={{ fontFamily: data.design_settings.font_family }}>
                                                            {data.design_settings.custom_message || 'Votre avis compte pour nous!'}
                                                        </h1>
                                                        <p className="text-sm opacity-60 mb-5 text-center">
                                                            {company.name}
                                                        </p>

                                                        {/* Stars */}
                                                        <div className="flex gap-1.5 justify-center mb-5">
                                                            {[5, 4, 3, 2, 1].map((v) => (
                                                                <button
                                                                    key={v}
                                                                    type="button"
                                                                    onClick={() => setPreviewRating(v)}
                                                                    className={`text-3xl transition-all hover:scale-110 ${
                                                                        previewRating >= v ? 'opacity-100' : 'opacity-25'
                                                                    }`}
                                                                    style={{ color: data.design_settings.star_color }}
                                                                >
                                                                    {STAR_ICONS[data.design_settings.star_style].icon}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <p className="text-center text-xs opacity-50 mb-4">
                                                            {previewRating} / 5
                                                        </p>

                                                        {/* Comment */}
                                                        <textarea
                                                            className="w-full border rounded-lg p-3 text-sm mb-4 resize-none"
                                                            rows="3"
                                                            placeholder="Partagez votre expérience..."
                                                            disabled
                                                            style={{ 
                                                                borderColor: data.design_settings.primary_color + '30',
                                                                fontFamily: data.design_settings.font_family,
                                                                backgroundColor: data.design_settings.card_background,
                                                                color: data.design_settings.text_color,
                                                            }}
                                                        />

                                                        {/* Submit Button */}
                                                        <button
                                                            type="button"
                                                            className={`w-full text-white py-3 font-semibold text-sm transition-all hover:opacity-90 ${BUTTON_STYLES[data.design_settings.button_style].class}`}
                                                            style={{ backgroundColor: data.design_settings.primary_color }}
                                                        >
                                                            Envoyer mon avis
                                                        </button>

                                                        <p className="text-[10px] text-center mt-3 opacity-40">
                                                            Votre avis nous aide à améliorer nos services
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Home indicator (mobile) */}
                                                {previewDevice === 'mobile' && (
                                                    <div className="bg-gray-800 h-6 flex items-center justify-center">
                                                        <div className="w-28 h-1 bg-gray-600 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

// ─── Composant Color Picker ───────────────────────────────────
function ColorPicker({ label, description, value, onChange }) {
    const [showPicker, setShowPicker] = useState(false);

    const presetColors = [
        '#111827', '#374151', '#6B7280', '#EF4444', '#F97316', '#F59E0B',
        '#10B981', '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
        '#1E40AF', '#059669', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <span className="block text-sm font-medium text-gray-900">{label}</span>
                    {description && <span className="block text-xs text-gray-500">{description}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-20 text-xs font-mono text-center border border-gray-200 rounded-lg py-1.5 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPicker(!showPicker)}
                        className="w-9 h-9 rounded-lg border-2 border-gray-200 transition-all hover:scale-105 shadow-sm"
                        style={{ backgroundColor: value }}
                    />
                </div>
            </div>
            
            {showPicker && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg">
                    {presetColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => { onChange(color); setShowPicker(false); }}
                            className={`w-7 h-7 rounded-md transition-all hover:scale-110 ${
                                value === color ? 'ring-2 ring-purple-500 ring-offset-1' : 'ring-1 ring-black/10'
                            }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <div className="w-full mt-1">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-8 rounded cursor-pointer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
