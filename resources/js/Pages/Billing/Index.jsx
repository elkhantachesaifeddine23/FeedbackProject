import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

const planOrder = ['free', 'basic', 'pro'];

const featureLabels = {
    ai_replies: 'Réponses IA',
    ai_radar:   'Radar IA',
    tasks:      'Tâches',
    sms:        'Envoi SMS',
};

const planMeta = {
    free:  { gradient: 'from-slate-500 to-gray-600',   light: 'bg-slate-50',  ring: 'ring-slate-200', badgeBg: 'bg-slate-100 text-slate-700',   btnClass: 'bg-slate-600 hover:bg-slate-700', icon: '🆓', description: 'Pour découvrir la plateforme' },
    basic: { gradient: 'from-blue-600 to-cyan-500',    light: 'bg-blue-50',   ring: 'ring-blue-200',  badgeBg: 'bg-blue-100 text-blue-700',    btnClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600', icon: '⚡', description: 'Pour les professionnels' },
    pro:   { gradient: 'from-violet-600 to-purple-500', light: 'bg-violet-50', ring: 'ring-violet-300', badgeBg: 'bg-violet-100 text-violet-700', btnClass: 'bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600', icon: '👑', description: 'Pour les entreprises exigeantes' },
};

export default function BillingIndex({ billing, plans, addons, stripeKey }) {
    const { auth, flash } = usePage().props;
    const [loading, setLoading] = useState(null);

    const currentPlan = billing.plan;
    const isActive = billing.status === 'active' || billing.status === 'trialing';
    const meta = planMeta[currentPlan] || planMeta.free;

    function handleSubscribe(planSlug) {
        setLoading(planSlug);
        router.post(route('billing.subscribe'), { plan: planSlug }, {
            onFinish: () => setLoading(null),
        });
    }

    function handleBuyAddon(addonSlug) {
        setLoading(addonSlug);
        router.post(route('billing.addon'), { addon: addonSlug }, {
            onFinish: () => setLoading(null),
        });
    }

    function handlePortal() {
        setLoading('portal');
        router.post(route('billing.portal'), {}, {
            onFinish: () => setLoading(null),
        });
    }

    return (
        <AuthenticatedLayout user={auth.user} header="Abonnement & Facturation">
            <Head title="Abonnement" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

                {/* Flash */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 text-sm font-medium">
                        <span className="text-lg">✅</span> {flash.success}
                    </div>
                )}

                {/* ═══════════════════════════════════════════
                    CURRENT PLAN HERO
                ═══════════════════════════════════════════ */}
                <section className="relative overflow-hidden rounded-3xl shadow-xl">
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-95`} />
                    <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="relative p-8 sm:p-10">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{meta.icon}</span>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-extrabold text-white tracking-tight">Plan {billing.plan_label}</h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-red-400/30 text-red-100'}`}>
                                                {isActive ? '● Actif' : billing.status}
                                            </span>
                                        </div>
                                        <p className="text-white/70 text-sm mt-0.5">{meta.description}</p>
                                    </div>
                                </div>
                                {billing.ends_at && (
                                    <p className="text-red-200 text-sm font-medium flex items-center gap-2">
                                        <span>⚠️</span> Annulé — actif jusqu'au {new Date(billing.ends_at).toLocaleDateString('fr-FR')}
                                    </p>
                                )}
                                {billing.current_period_end && !billing.ends_at && currentPlan !== 'free' && (
                                    <p className="text-white/50 text-xs">
                                        Prochain renouvellement le {new Date(billing.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            {currentPlan !== 'free' && (
                                <button
                                    onClick={handlePortal}
                                    disabled={loading === 'portal'}
                                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25 transition-all disabled:opacity-50"
                                >
                                    {loading === 'portal' ? (
                                        <span className="flex items-center gap-2"><Spinner /> Chargement…</span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Gérer via Stripe
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* ── Balance glass cards ── */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard
                                label="Solde Emails"
                                value={billing.email_limit === null ? '∞' : (billing.emails_remaining ?? 0)}
                                sub={billing.email_limit === null ? `${billing.emails_sent ?? 0} envoyés` : `${billing.emails_sent ?? 0} / ${billing.email_limit} utilisés`}
                                icon={<MailIcon />}
                                pct={billing.email_limit === null ? null : (billing.email_limit > 0 ? Math.round(((billing.emails_sent ?? 0) / billing.email_limit) * 100) : 0)}
                            />
                            <GlassCard
                                label="SMS mensuel"
                                value={billing.monthly_sms_remaining ?? 0}
                                sub={`${billing.monthly_sms_used ?? 0} / ${billing.monthly_sms_units ?? 0} utilisés`}
                                icon={<SmsIcon />}
                                pct={billing.monthly_sms_units > 0 ? Math.round((billing.monthly_sms_used / billing.monthly_sms_units) * 100) : 0}
                            />
                            <GlassCard
                                label="SMS Add-on"
                                value={billing.addon_sms_remaining ?? 0}
                                sub="unités à vie"
                                icon={<GiftIcon />}
                            />
                            <GlassCard
                                label="Total SMS"
                                value={billing.total_sms_available ?? 0}
                                sub="disponibles"
                                icon={<ChartIcon />}
                                highlight
                            />
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    PLANS
                ═══════════════════════════════════════════ */}
                <section>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Choisissez votre plan</h2>
                        <p className="text-gray-500 mt-2 text-sm">Changez de plan à tout moment. Pas de frais cachés.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {plans.map((plan) => {
                            const isCurrent = plan.slug === currentPlan;
                            const pm = planMeta[plan.slug] || planMeta.free;
                            const currentIdx = planOrder.indexOf(currentPlan);
                            const planIdx = planOrder.indexOf(plan.slug);
                            const isUpgrade = planIdx > currentIdx;
                            const isPro = plan.slug === 'pro';

                            return (
                                <div
                                    key={plan.slug}
                                    className={`relative group rounded-3xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                        isCurrent
                                            ? `border-2 shadow-lg ${plan.slug === 'basic' ? 'border-blue-300' : plan.slug === 'pro' ? 'border-violet-300' : 'border-slate-300'}`
                                            : isPro
                                                ? 'border-2 border-violet-300 shadow-lg shadow-violet-100/50'
                                                : 'border-gray-200 shadow-sm hover:shadow-xl'
                                    }`}
                                >
                                    {/* Pro badge */}
                                    {isPro && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg shadow-violet-200">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                Recommandé
                                            </span>
                                        </div>
                                    )}

                                    {/* Current plan indicator */}
                                    {isCurrent && (
                                        <div className="absolute -top-3 right-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 ${pm.badgeBg} text-xs font-bold rounded-full`}>
                                                ✓ Actuel
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-8">
                                        {/* Plan header */}
                                        <div className="text-center mb-6">
                                            <span className="text-3xl">{pm.icon}</span>
                                            <h3 className="mt-2 text-xl font-bold text-gray-900">{plan.label}</h3>
                                            <p className="text-xs text-gray-400 mt-1">{pm.description}</p>
                                            <div className="mt-4">
                                                {plan.price_eur === 0 ? (
                                                    <div className="text-4xl font-black text-gray-900">Gratuit</div>
                                                ) : (
                                                    <div className="flex items-end justify-center gap-1">
                                                        <span className="text-5xl font-black text-gray-900">{plan.price_eur}</span>
                                                        <span className="text-xl font-bold text-gray-400 mb-1">€</span>
                                                        <span className="text-sm text-gray-400 mb-2">/mois</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

                                        {/* Features */}
                                        <ul className="space-y-3.5">
                                            <FeatureItem ok label={plan.email_limit === null ? 'Emails illimités' : `${plan.email_limit} emails/mois`} />
                                            <FeatureItem ok={plan.sms_units > 0} label={plan.sms_units > 0 ? `${plan.sms_units} unités SMS/mois` : 'Pas de SMS'} />
                                            {Object.entries(featureLabels).map(([key, label]) => (
                                                <FeatureItem key={key} ok={plan.features[key]} label={label} />
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <div className="mt-8">
                                            {isCurrent ? (
                                                <div className="w-full text-center py-3 text-sm font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                                    Plan actuel
                                                </div>
                                            ) : plan.slug === 'free' ? (
                                                <button
                                                    onClick={handlePortal}
                                                    disabled={currentPlan === 'free' || loading === 'portal'}
                                                    className="w-full py-3 text-sm font-bold rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {currentPlan === 'free' ? 'Gratuit' : 'Gérer via Stripe'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribe(plan.slug)}
                                                    disabled={loading === plan.slug}
                                                    className={`w-full py-3.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-50 shadow-lg hover:shadow-xl ${pm.btnClass}`}
                                                >
                                                    {loading === plan.slug ? (
                                                        <span className="flex items-center justify-center gap-2"><Spinner /> Redirection…</span>
                                                    ) : (
                                                        isUpgrade ? `Passer au ${plan.label} →` : `Changer pour ${plan.label}`
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    SMS ADD-ONS
                ═══════════════════════════════════════════ */}
                <section>
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recharges SMS</h2>
                            <p className="text-gray-500 mt-1 text-sm">Achat unique — les unités ne s'expirent jamais.</p>
                        </div>
                        {!billing.features?.sms && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
                                🔒 Plan Basic requis
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {addons.map((addon, idx) => (
                            <div
                                key={addon.slug}
                                className={`relative rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                    !billing.features?.sms ? 'opacity-60 border-gray-200' : 'border-gray-200 shadow-sm'
                                }`}
                            >
                                {/* Top accent */}
                                <div className={`h-1.5 ${idx === 0 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-violet-400 to-purple-500'}`} />

                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{idx === 0 ? '🚀' : '🏢'}</span>
                                                <h3 className="text-lg font-bold text-gray-900">{addon.label}</h3>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500">
                                                <span className="font-semibold text-gray-700">{addon.units.toLocaleString()}</span> unités SMS
                                                <span className="mx-1.5 text-gray-300">•</span>
                                                <span className="text-gray-400">{(addon.price_eur / addon.units * 100).toFixed(1)} cts/unité</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-gray-900">{addon.price_eur}€</div>
                                            <div className="text-xs text-gray-400">paiement unique</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBuyAddon(addon.slug)}
                                        disabled={loading === addon.slug || !billing.features?.sms}
                                        className={`mt-5 w-full py-3 text-sm font-bold rounded-xl transition-all disabled:cursor-not-allowed ${
                                            !billing.features?.sms
                                                ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                                : idx === 0
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg disabled:opacity-50'
                                                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md hover:shadow-lg disabled:opacity-50'
                                        }`}
                                    >
                                        {!billing.features?.sms
                                            ? '🔒 Plan Basic requis'
                                            : loading === addon.slug
                                                ? <span className="flex items-center justify-center gap-2"><Spinner /> Redirection…</span>
                                                : 'Acheter maintenant'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    SMS COSTS
                ═══════════════════════════════════════════ */}
                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🌍</div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Coût SMS par destination</h3>
                                <p className="text-xs text-gray-400">Référence de consommation SMS.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5">
                            <p className="text-base font-semibold text-blue-900">
                                🇫🇷 1 SMS France = 1 unité
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════ */

function GlassCard({ label, value, sub, icon, pct = null, highlight = false }) {
    const usedPct = pct ?? 0;
    const remainPct = Math.max(100 - usedPct, 2);
    const isLow = pct !== null && usedPct > 80;

    return (
        <div className={`rounded-2xl p-4 backdrop-blur-sm transition-transform hover:scale-[1.02] ${
            highlight
                ? 'bg-white/20 border border-white/30 ring-1 ring-white/20'
                : 'bg-white/10 border border-white/20'
        }`}>
            <div className="flex items-center gap-2 text-white/70 text-xs font-medium uppercase tracking-wide">
                <span className="w-5 h-5 opacity-80">{icon}</span>
                {label}
            </div>
            <div className={`mt-2 text-3xl font-black ${highlight ? 'text-white' : 'text-white/90'}`}>
                {value}
            </div>
            <p className="text-white/50 text-xs mt-1">{sub}</p>
            {pct !== null && (
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-white/50'}`}
                        style={{ width: `${remainPct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function FeatureItem({ ok, label }) {
    return (
        <li className="flex items-center gap-3 text-sm">
            {ok ? (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </span>
            ) : (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </span>
            )}
            <span className={ok ? 'text-gray-700 font-medium' : 'text-gray-400'}>{label}</span>
        </li>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function SmsIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    );
}

function GiftIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 00-2 2v2h6zm0 0V6a4 4 0 014-4 2 2 0 012 2v2h-6zm-8 4h16M6 12v8a2 2 0 002 2h8a2 2 0 002-2v-8" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}
