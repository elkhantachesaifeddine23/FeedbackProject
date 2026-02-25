import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Target,
    AlertTriangle,
    Bell,
    MessageCircle,
    Send,
    Eye,
    CheckCircle2,
} from 'lucide-react';

export default function Index({ auth, stats, recentFeedbacks, globalQRCode }) {
    const [qrModalOpen, setQrModalOpen] = useState(false);

    const responseRate = stats.response_rate ?? 0;
    const avgRating = stats.avg_rating ?? null;
    const nps = stats.nps ?? 0;
    const totalRequests = stats.requests_total ?? 0;
    const completedTotal = stats.feedbacks_completed ?? 0;
    const failedTotal = stats.feedbacks_failed ?? 0;
    const requestsLast7d = stats.requests_last_7d ?? 0;
    const responseRate7d = stats.response_rate_7d ?? 0;

    const positiveCount = stats.positive_count ?? 0;
    const neutralCount = stats.neutral_count ?? 0;
    const negativeCount = stats.negative_count ?? 0;

    const feedbackItems = Array.isArray(recentFeedbacks?.data)
        ? recentFeedbacks.data
        : Array.isArray(recentFeedbacks)
            ? recentFeedbacks
            : [];

    const getInsight = () => {
        if (responseRate >= 80) {
            return {
                tone: 'emerald',
                title: '🎉 Excellente performance',
                message: `Votre taux de réponse est à ${responseRate}%. Continuez ainsi!`,
            };
        }
        if (responseRate < 40) {
            return {
                tone: 'rose',
                title: '⚠️ Attention requise',
                message: `Taux de réponse: ${responseRate}%. Lancez une relance immédiate.`,
            };
        }
        if (avgRating && avgRating >= 4.2) {
            return {
                tone: 'indigo',
                title: '😊 Clients satisfaits',
                message: `Note moyenne ${avgRating}/5. Excellent!`,
            };
        }
        return {
            tone: 'amber',
            title: '💡 Opportunité',
            message: 'Améliorez la collecte des feedbacks et la rapidité des réponses.',
        };
    };

    const insight = getInsight();

    const trends = {
        requests: totalRequests > 0
            ? Math.round(((requestsLast7d - totalRequests / 4) / (totalRequests / 4 || 1)) * 100)
            : null,
        response_rate: Math.round(responseRate7d - responseRate),
        satisfaction: avgRating !== null ? Math.round((avgRating - 4) * 25) : null,
    };

    const goals = {
        response_rate: {
            current: responseRate,
            target: 70,
            progress: Math.min(100, Math.round((responseRate / 70) * 100)),
        },
        avg_response_time: {
            current: responseRate7d ? Math.max(1, Math.round((100 - responseRate7d) / 10)) : 3,
            target: 3,
            progress: responseRate7d ? Math.min(100, Math.round((responseRate7d / 70) * 100)) : 40,
        },
        satisfaction: {
            current: avgRating ?? 0,
            target: 4.5,
            progress: avgRating ? Math.min(100, Math.round((avgRating / 4.5) * 100)) : 0,
        },
    };

    const alerts = {
        critical_feedbacks: responseRate < 50 ? [true] : [],
        overdue_feedbacks: failedTotal > 0 ? [{ days_since_sent: 7 }] : [],
        sms_credits: stats.sms_credits ? {
            remaining: stats.sms_credits.remaining,
            monthly_quota: stats.sms_credits.quota,
            monthly_used: stats.sms_credits.used,
            addon_balance: stats.sms_credits.addons,
            expires_in_days: stats.sms_credits.expires_in_days,
            is_low: stats.sms_credits.status === 'warning',
            is_critical: stats.sms_credits.status === 'critical',
        } : null,
    };

    const downloadGlobalQR = () => {
        if (!globalQRCode) return;
        const link = document.createElement('a');
        link.href = globalQRCode;
        link.download = 'qr-feedback-global.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard Exécutif" />

            <div className="space-y-8">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative p-8 lg:p-10">
                        <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-black text-white mb-2">📊 Dashboard Exécutif</h1>
                                <p className="text-indigo-100 text-lg">Vue d'ensemble de votre performance client</p>
                            </div>
                            <div className={`px-5 py-3 rounded-2xl text-sm font-bold backdrop-blur-sm border-2 max-w-xs ${
                                insight.tone === 'emerald' ? 'bg-emerald-500/30 border-emerald-400/50 text-white' :
                                insight.tone === 'rose' ? 'bg-rose-500/30 border-rose-400/50 text-white' :
                                insight.tone === 'indigo' ? 'bg-indigo-500/40 border-indigo-400/50 text-white' :
                                'bg-amber-500/30 border-amber-400/50 text-white'
                            }`}>
                                <div className="text-xs opacity-80 mb-1 font-semibold">{insight.title}</div>
                                {insight.message}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
                            <QuickActionButton icon={<Send size={18} />} label="Envoyer feedback" href={route('customers.index')} />
                            <QuickActionButton icon={<Bell size={18} />} label="Relancer clients" href={route('feedbacks.index')} badge={failedTotal} />
                            <QuickActionButton icon={<MessageCircle size={18} />} label="Voir feedbacks" href={route('feedbacks.index')} badge={stats.feedbacks_sent} />
                            <QuickActionButton icon={<Eye size={18} />} label="Analytics" href={route('analytics.index')} />
                            {globalQRCode && (
                                <QuickActionButton icon={<CheckCircle2 size={18} />} label="QR global" onClick={() => setQrModalOpen(true)} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Taux de réponse" value={`${responseRate}%`} subtext="global" icon="📈" tone="blue" target="70%" trend={trends.response_rate} />
                    <KPICard title="Volume 7 jours" value={requestsLast7d} subtext="demandes" icon="⏱️" tone="purple" target="+10%" trend={trends.requests} />
                    <KPICard title="Satisfaction" value={avgRating ? `${avgRating}/5` : '—'} subtext="note moyenne" icon="😊" tone="emerald" target="4.5/5" trend={trends.satisfaction} />
                    <KPICard title="NPS" value={nps} subtext="Net Promoter Score" icon="🎯" tone="indigo" trend={null} />
                </div>

                <AlertsSection alerts={alerts} />

                <TrendsSection trends={trends} stats={{ requests_last_7d: requestsLast7d, response_rate_7d: responseRate7d, avg_rating: avgRating }} />

                <GoalsSection goals={goals} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Sentiment des clients</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <SentimentBadge label="Positif" value={positiveCount} color="emerald" icon="😊" />
                            <SentimentBadge label="Neutre" value={neutralCount} color="slate" icon="😐" />
                            <SentimentBadge label="Négatif" value={negativeCount} color="rose" icon="😞" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Distribution par canal</h3>
                        <div className="space-y-3">
                            <ChannelStat label="📧 Email" value={stats.channel_email || 0} />
                            <ChannelStat label="📱 SMS" value={stats.channel_sms || 0} />
                            <ChannelStat label="💬 WhatsApp" value={stats.channel_whatsapp || 0} />
                            <ChannelStat label="📲 QR Code" value={stats.channel_qr || 0} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Derniers feedbacks</h3>
                        <Link href={route('feedbacks.index')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Voir tout</Link>
                    </div>
                    <div className="space-y-3">
                        {feedbackItems.slice(0, 5).map((fb) => (
                            <div key={fb.id} className="flex items-start justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-gray-900 truncate">{fb.customer?.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{fb.created_at}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-gray-700">{fb.rating ? `${fb.rating}/5` : '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {qrModalOpen && globalQRCode && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setQrModalOpen(false)}>
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-gray-900 mb-6">QR Code Global</h3>
                        <div className="flex justify-center mb-6 bg-gray-50 p-6 rounded-xl">
                            <img src={globalQRCode} alt="QR Code Global" className="w-64 h-64" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={downloadGlobalQR} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all">Télécharger</button>
                            <button onClick={() => setQrModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all">Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function KPICard({ title, value, subtext, icon, tone, target, trend }) {
    const toneClasses = {
        blue: 'from-blue-500 to-cyan-600',
        purple: 'from-purple-500 to-fuchsia-600',
        emerald: 'from-emerald-500 to-teal-600',
        indigo: 'from-indigo-500 to-violet-600',
    };

    const trendColor = trend === null ? 'text-gray-400' : trend >= 0 ? 'text-emerald-600' : 'text-rose-600';
    const TrendIcon = trend === null ? null : trend >= 0 ? TrendingUp : TrendingDown;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
                    <p className="text-3xl font-black text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{subtext}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${toneClasses[tone]} text-white flex items-center justify-center text-lg font-bold`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-600 font-medium">Cible: {target}</span>
                {TrendIcon && trend !== null && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon size={14} />
                        <span className="text-xs font-semibold">{trend > 0 ? '+' : ''}{trend}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function QuickActionButton({ icon, label, href, badge, onClick }) {
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="relative inline-flex flex-col items-center gap-2 px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white text-xs font-semibold hover:bg-white/25 transition-all group"
            >
                <div className="text-lg group-hover:scale-110 transition-transform">{icon}</div>
                <span className="text-center leading-tight">{label}</span>
                {badge ? (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {badge}
                    </span>
                ) : null}
            </button>
        );
    }

    return (
        <Link
            href={href}
            className="relative inline-flex flex-col items-center gap-2 px-4 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white text-xs font-semibold hover:bg-white/25 transition-all group"
        >
            <div className="text-lg group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-center leading-tight">{label}</span>
            {badge ? (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badge}
                </span>
            ) : null}
        </Link>
    );
}

function AlertsSection({ alerts }) {
    const criticalCount = alerts.critical_feedbacks?.length || 0;
    const overdueCount = alerts.overdue_feedbacks?.length || 0;
    const totalAlerts = criticalCount + overdueCount;

    if (totalAlerts === 0 && !alerts.sms_credits) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border-2 border-rose-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    <AlertTriangle size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Alertes urgentes</h3>
                    <p className="text-sm text-gray-600">{totalAlerts} action{totalAlerts > 1 ? 's' : ''} recommandée{totalAlerts > 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="space-y-3">
                {criticalCount > 0 && (
                    <AlertCard
                        icon="🔴"
                        title={`${criticalCount} feedback${criticalCount > 1 ? 's' : ''} critique${criticalCount > 1 ? 's' : ''} en attente`}
                        description="Taux de réponse faible, risque de churn"
                        action={{ label: 'Relancer maintenant', href: route('feedbacks.index') }}
                    />
                )}

                {overdueCount > 0 && (
                    <AlertCard
                        icon="⏰"
                        title={`${overdueCount} client${overdueCount > 1 ? 's' : ''} en attente`}
                        description="Feedbacks non finalisés"
                        action={{ label: 'Vérifier', href: route('feedbacks.index') }}
                    />
                )}
            </div>
        </div>
    );
}

function AlertCard({ icon, title, description, action, variant = 'default' }) {
    const variantStyles = {
        default: 'bg-white border-gray-200',
        warning: 'bg-amber-50 border-amber-300',
        critical: 'bg-red-50 border-red-300',
    };

    const buttonStyles = {
        default: 'bg-gradient-to-r from-rose-500 to-orange-600',
        warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
        critical: 'bg-gradient-to-r from-red-600 to-rose-600',
    };

    return (
        <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${variantStyles[variant]}`}>
            <div className="flex items-start gap-3 flex-1">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                    <p className={`font-semibold ${variant === 'default' ? 'text-gray-900' : variant === 'warning' ? 'text-amber-900' : 'text-red-900'}`}>
                        {title}
                    </p>
                    <div className={`text-xs mt-1 ${variant === 'default' ? 'text-gray-600' : variant === 'warning' ? 'text-amber-700' : 'text-red-700'}`}>
                        {description}
                    </div>
                </div>
            </div>
            <Link
                href={action.href}
                className={`inline-flex items-center gap-1 px-3 py-2 ${buttonStyles[variant]} text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0`}
            >
                {action.label}
                <span>→</span>
            </Link>
        </div>
    );
}

function TrendsSection({ trends, stats }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Tendances (cette semaine vs moyenne)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <TrendRow label="Demandes envoyées" delta={trends.requests} current={stats.requests_last_7d} />
                <TrendRow label="Taux de réponse" delta={trends.response_rate} current={`${stats.response_rate_7d}%`} />
                <TrendRow label="Satisfaction" delta={trends.satisfaction} current={stats.avg_rating ? `${stats.avg_rating}/5` : '—'} />
            </div>
        </div>
    );
}

function TrendRow({ label, delta, current }) {
    const isPositive = delta === null ? null : delta >= 0;
    const Color = isPositive === null ? 'text-gray-400' : isPositive ? 'text-emerald-600' : 'text-rose-600';
    const Icon = isPositive === null ? null : isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">{label}</p>
            <p className="text-2xl font-black text-gray-900">{current}</p>
            {Icon && delta !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${Color}`}>
                    <Icon size={16} />
                    <span className="text-sm font-bold">{delta > 0 ? '+' : ''}{delta}%</span>
                </div>
            )}
        </div>
    );
}

function GoalsSection({ goals }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
                <Target className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Objectifs du mois</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GoalProgress label="Taux de réponse" current={goals.response_rate.current} target={goals.response_rate.target} unit="%" progress={goals.response_rate.progress} />
                <GoalProgress label="Temps moyen de réponse" current={goals.avg_response_time.current} target={goals.avg_response_time.target} unit="jours" progress={goals.avg_response_time.progress} />
                <GoalProgress label="Satisfaction client" current={goals.satisfaction.current} target={goals.satisfaction.target} unit="/5" progress={goals.satisfaction.progress} />
            </div>
        </div>
    );
}

function GoalProgress({ label, current, target, unit, progress }) {
    return (
        <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 mb-4">{label}</p>
            <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 45 * progress / 100} ${2 * Math.PI * 45}`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-gray-900">{Math.round(progress)}%</span>
                </div>
            </div>
            <p className="text-sm text-gray-600">{current} / {target} {unit}</p>
        </div>
    );
}

function SentimentBadge({ label, value, color, icon }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        slate: 'bg-slate-50 text-slate-900 border-slate-200',
        rose: 'bg-rose-50 text-rose-900 border-rose-200',
    };

    return (
        <div className={`p-4 rounded-xl border-2 text-center ${colorClasses[color]}`}>
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-xs font-semibold opacity-75">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

function ChannelStat({ label, value }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-lg font-black text-indigo-600">{value}</span>
        </div>
    );
}
