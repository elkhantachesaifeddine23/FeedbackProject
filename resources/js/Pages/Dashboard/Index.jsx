import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import {
    TrendingUp, TrendingDown, Target, AlertTriangle, Bell, MessageCircle, Send, Eye,
    CheckCircle2, BarChart3, Bot, UserCheck, Clock, Star, ArrowUpRight,
    ShieldCheck, Zap, Globe2, Crown, Activity, ListTodo, AlertCircle,
    ChevronRight, Sparkles, CircleDot, Download, X
} from 'lucide-react';

export default function Index({ auth, stats, extendedStats = {}, recentFeedbacks, feedbackTrend, globalQRCode }) {
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
    const customersCount = stats.customers ?? 0;

    const tasks = extendedStats.tasks ?? { total: 0, open: 0, completed: 0, overdue: 0, critical: 0 };
    const replies = extendedStats.replies ?? { total: 0, ai: 0, admin: 0, avg_reply_hours: null };
    const resolution = extendedStats.resolution ?? { resolved: 0, unresolved: 0, pinned: 0, rate: 0 };
    const sources = extendedStats.sources ?? { manual: 0, google: 0 };
    const platforms = extendedStats.platforms ?? { active: 0, total: 0 };
    const subscription = extendedStats.subscription;
    const google = extendedStats.google ?? { connected: false, last_sync: null };
    const ratingDistribution = extendedStats.rating_distribution ?? [];
    const autoReplyEnabled = extendedStats.auto_reply_enabled ?? false;

    const feedbackItems = Array.isArray(recentFeedbacks?.data)
        ? recentFeedbacks.data
        : Array.isArray(recentFeedbacks) ? recentFeedbacks : [];

    const trendData = Array.isArray(feedbackTrend) ? feedbackTrend : [];
    const maxTrend = Math.max(...trendData.map(d => d.count), 1);

    const getInsight = () => {
        if (responseRate >= 80) return { tone: 'emerald', icon: '🎉', title: 'Excellente performance', message: `Taux de réponse à ${responseRate}%. Continuez ainsi!` };
        if (responseRate < 40) return { tone: 'rose', icon: '⚠️', title: 'Attention requise', message: `Taux de réponse: ${responseRate}%. Relancez vos clients.` };
        if (avgRating && avgRating >= 4.2) return { tone: 'indigo', icon: '😊', title: 'Clients satisfaits', message: `Note moyenne ${avgRating}/5. Excellent!` };
        return { tone: 'amber', icon: '💡', title: 'Opportunité', message: 'Améliorez la collecte et la rapidité des réponses.' };
    };
    const insight = getInsight();

    const trends = {
        requests: totalRequests > 0 ? Math.round(((requestsLast7d - totalRequests / 4) / (totalRequests / 4 || 1)) * 100) : null,
        response_rate: Math.round(responseRate7d - responseRate),
        satisfaction: avgRating !== null ? Math.round((avgRating - 4) * 25) : null,
    };

    const planConfig = {
        free: { label: 'Free', color: 'bg-gray-100 text-gray-600' },
        starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
        pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
    };
    const plan = subscription ? planConfig[subscription.plan] || planConfig.free : null;

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
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Hero Header */}
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800"></div>
                    <div className="absolute inset-0">
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative px-8 py-7">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
                                    <BarChart3 className="w-6 h-6 text-indigo-300" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                                        {plan && (
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${plan.color}`}>
                                                {plan.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-indigo-300 text-sm mt-0.5">Vue d'ensemble de votre performance</p>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm backdrop-blur-sm border ${
                                insight.tone === 'emerald' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200' :
                                insight.tone === 'rose' ? 'bg-rose-500/15 border-rose-400/30 text-rose-200' :
                                insight.tone === 'indigo' ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' :
                                'bg-amber-500/15 border-amber-400/30 text-amber-200'
                            }`}>
                                <span className="text-base">{insight.icon}</span>
                                <div>
                                    <span className="text-xs font-semibold opacity-80">{insight.title}</span>
                                    <span className="text-xs opacity-70 ml-1.5">— {insight.message}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <QuickAction icon={<Send className="w-4 h-4" />} label="Envoyer feedback" href={route('customers.index')} />
                            <QuickAction icon={<Bell className="w-4 h-4" />} label="Relancer" href={route('feedbacks.index')} badge={failedTotal} />
                            <QuickAction icon={<MessageCircle className="w-4 h-4" />} label="Feedbacks" href={route('feedbacks.index')} badge={stats.feedbacks_sent} />
                            <QuickAction icon={<Eye className="w-4 h-4" />} label="Analytics" href={route('analytics.index')} />
                            {globalQRCode && (
                                <QuickAction icon={<CircleDot className="w-4 h-4" />} label="QR global" onClick={() => setQrModalOpen(true)} />
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KPICard title="Clients" value={customersCount} sub={`${completedTotal} réponses`} icon={<UserCheck className="w-5 h-5" />} color="bg-sky-500" />
                    <KPICard title="Taux de réponse" value={`${responseRate}%`} sub="Cible: 70%" icon={<Activity className="w-5 h-5" />} color="bg-emerald-500" trend={trends.response_rate} />
                    <KPICard title="Satisfaction" value={avgRating ? `${avgRating}/5` : '—'} sub="Note moyenne" icon={<Star className="w-5 h-5" />} color="bg-amber-500" trend={trends.satisfaction} />
                    <KPICard title="NPS" value={nps} sub="Net Promoter Score" icon={<Target className="w-5 h-5" />} color="bg-violet-500" />
                    <KPICard title="Volume 7j" value={requestsLast7d} sub="Demandes envoyées" icon={<TrendingUp className="w-5 h-5" />} color="bg-indigo-500" trend={trends.requests} />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Col 1-2 */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Sparkline Trend */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Activité des 14 derniers jours</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{trendData.reduce((a, b) => a + b.count, 0)} feedbacks reçus</p>
                                </div>
                                <Link href={route('analytics.index')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    Détails <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="flex items-end gap-1 h-24">
                                {trendData.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        <div
                                            className="w-full bg-indigo-500/80 rounded-t-sm hover:bg-indigo-600 transition-colors cursor-default min-h-[2px]"
                                            style={{ height: `${Math.max(2, (d.count / maxTrend) * 100)}%` }}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                            {d.count} — {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-gray-400">{trendData[0] ? new Date(trendData[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                                <span className="text-[10px] text-gray-400">Aujourd'hui</span>
                            </div>
                        </div>

                        {/* Rating Distribution + Sentiment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution des notes</h3>
                                <div className="space-y-2.5">
                                    {ratingDistribution.map(({ star, count, percent }) => (
                                        <div key={star} className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-gray-500 w-8 text-right">{star} ★</span>
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500 w-14 text-right">{count} ({percent}%)</span>
                                        </div>
                                    ))}
                                </div>
                                {avgRating && (
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Moyenne</span>
                                        <span className="text-sm font-bold text-gray-900">{avgRating} / 5</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment des clients</h3>
                                <div className="space-y-3">
                                    <SentimentRow label="Positif" count={positiveCount} total={positiveCount + neutralCount + negativeCount} color="emerald" emoji="😊" />
                                    <SentimentRow label="Neutre" count={neutralCount} total={positiveCount + neutralCount + negativeCount} color="amber" emoji="😐" />
                                    <SentimentRow label="Négatif" count={negativeCount} total={positiveCount + neutralCount + negativeCount} color="rose" emoji="😞" />
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Total avis</span>
                                    <span className="text-sm font-bold text-gray-900">{positiveCount + neutralCount + negativeCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Channels + Sources */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Canaux d'envoi</h3>
                                <div className="space-y-2">
                                    <ChannelBar label="Email" value={stats.channel_email || 0} total={totalRequests} icon="📧" color="bg-blue-500" />
                                    <ChannelBar label="SMS" value={stats.channel_sms || 0} total={totalRequests} icon="📱" color="bg-green-500" />
                                    <ChannelBar label="WhatsApp" value={stats.channel_whatsapp || 0} total={totalRequests} icon="💬" color="bg-emerald-500" />
                                    <ChannelBar label="QR Code" value={stats.channel_qr || 0} total={totalRequests} icon="📲" color="bg-purple-500" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sources des avis</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <SourceCard label="Manuel" count={sources.manual} icon="✍️" desc="Via lien/QR/email" />
                                    <SourceCard label="Google" count={sources.google} icon="🔍" desc="Google Business" />
                                </div>
                                {google.connected && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-gray-500">Google connecté</span>
                                        {google.last_sync && (
                                            <span className="text-xs text-gray-400 ml-auto">
                                                Sync: {new Date(google.last_sync).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Feedbacks */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900">Derniers feedbacks</h3>
                                <Link href={route('feedbacks.index')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {feedbackItems.length > 0 ? feedbackItems.slice(0, 6).map((fb) => (
                                    <div key={fb.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                                            fb.rating >= 4 ? 'bg-emerald-500' : fb.rating === 3 ? 'bg-amber-400' : fb.rating ? 'bg-rose-500' : 'bg-gray-300'
                                        }`}>
                                            {fb.rating || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-900 truncate block">{fb.customer?.name || 'Anonyme'}</span>
                                            <span className="text-xs text-gray-400">{fb.created_at}</span>
                                        </div>
                                        <StatusPill status={fb.status} />
                                    </div>
                                )) : (
                                    <div className="px-5 py-8 text-center text-sm text-gray-400">
                                        Aucun feedback reçu pour le moment
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Sidebar */}
                    <div className="space-y-4">

                        {/* Alerts */}
                        {(failedTotal > 0 || responseRate < 50 || tasks.critical > 0 || tasks.overdue > 0) && (
                            <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                    <h3 className="text-sm font-semibold text-rose-900">Alertes</h3>
                                </div>
                                <div className="space-y-2">
                                    {responseRate < 50 && <AlertRow icon="🔴" text="Taux de réponse faible" />}
                                    {failedTotal > 0 && <AlertRow icon="⏰" text={`${failedTotal} envoi${failedTotal > 1 ? 's' : ''} échoué${failedTotal > 1 ? 's' : ''}`} />}
                                    {tasks.critical > 0 && <AlertRow icon="🚨" text={`${tasks.critical} tâche${tasks.critical > 1 ? 's' : ''} critique${tasks.critical > 1 ? 's' : ''}`} />}
                                    {tasks.overdue > 0 && <AlertRow icon="📅" text={`${tasks.overdue} tâche${tasks.overdue > 1 ? 's' : ''} en retard`} />}
                                </div>
                            </div>
                        )}

                        {/* AI & Replies */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Bot className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Réponses IA</h3>
                                {autoReplyEnabled && (
                                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Auto ON</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <MiniStat label="IA" value={replies.ai} icon={<Zap className="w-3.5 h-3.5 text-purple-500" />} />
                                <MiniStat label="Manuelles" value={replies.admin} icon={<UserCheck className="w-3.5 h-3.5 text-blue-500" />} />
                            </div>
                            {replies.avg_reply_hours !== null && (
                                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-600">
                                        Temps moyen: <span className="font-semibold text-gray-900">
                                            {replies.avg_reply_hours < 1 ? `${Math.round(replies.avg_reply_hours * 60)} min` : `${replies.avg_reply_hours}h`}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Resolution */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Résolution</h3>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative w-14 h-14">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="3"
                                            strokeDasharray={`${(resolution.rate / 100) * 100.5} 100.5`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-900">{resolution.rate}%</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Résolus</span>
                                        <span className="font-semibold text-emerald-600">{resolution.resolved}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">En attente</span>
                                        <span className="font-semibold text-amber-600">{resolution.unresolved}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Épinglés</span>
                                        <span className="font-semibold text-indigo-600">{resolution.pinned}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-orange-500" />
                                    <h3 className="text-sm font-semibold text-gray-900">Tâches</h3>
                                </div>
                                <Link href={route('tasks.index')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                    Voir
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <MiniStat label="Ouvertes" value={tasks.open} icon={<CircleDot className="w-3.5 h-3.5 text-amber-500" />} />
                                <MiniStat label="Terminées" value={tasks.completed} icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />} />
                            </div>
                            {tasks.overdue > 0 && (
                                <div className="flex items-center gap-2 p-2.5 bg-rose-50 rounded-lg">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-xs text-rose-700 font-medium">{tasks.overdue} en retard</span>
                                </div>
                            )}
                        </div>

                        {/* Platforms */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe2 className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Plateformes</h3>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">{platforms.active} active{platforms.active > 1 ? 's' : ''} / {platforms.total} configurée{platforms.total > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {google.connected && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        Google
                                    </span>
                                )}
                                {platforms.active === 0 && !google.connected && (
                                    <span className="text-xs text-gray-400">Aucune plateforme connectée</span>
                                )}
                            </div>
                        </div>

                        {/* Objectifs */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-violet-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Objectifs</h3>
                            </div>
                            <div className="space-y-3">
                                <GoalRow label="Taux de réponse" current={responseRate} target={70} unit="%" />
                                <GoalRow label="Satisfaction" current={avgRating || 0} target={4.5} unit="/5" />
                                <GoalRow label="Résolution" current={resolution.rate} target={80} unit="%" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {qrModalOpen && globalQRCode && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setQrModalOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">QR Code Global</h3>
                            <button onClick={() => setQrModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-center mb-5 bg-gray-50 p-5 rounded-xl">
                            <img src={globalQRCode} alt="QR Code Global" className="w-52 h-52" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={downloadGlobalQR} className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> Télécharger
                            </button>
                            <button onClick={() => setQrModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function KPICard({ title, value, sub, icon, color, trend }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center text-white`}>{icon}</div>
                {trend !== null && trend !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        </div>
    );
}

function QuickAction({ icon, label, href, badge, onClick }) {
    const cls = "relative inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-white/20 transition-all";
    const content = (<>{icon}{label}{badge > 0 && (<span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{badge}</span>)}</>);
    if (onClick) return <button type="button" onClick={onClick} className={cls}>{content}</button>;
    return <Link href={href} className={cls}>{content}</Link>;
}

function SentimentRow({ label, count, total, color, emoji }) {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const colors = { emerald: 'bg-emerald-500', amber: 'bg-amber-400', rose: 'bg-rose-500' };
    return (
        <div className="flex items-center gap-3">
            <span className="text-base">{emoji}</span>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-500">{count} ({percent}%)</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${percent}%` }} />
                </div>
            </div>
        </div>
    );
}

function ChannelBar({ label, value, total, icon, color }) {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm">{icon}</span>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-500">{value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                </div>
            </div>
        </div>
    );
}

function SourceCard({ label, count, icon, desc }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-xl block mb-1">{icon}</span>
            <p className="text-lg font-bold text-gray-900">{count}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
        </div>
    );
}

function MiniStat({ label, value, icon }) {
    return (
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            {icon}
            <div>
                <p className="text-sm font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

function AlertRow({ icon, text }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-medium text-rose-800">{text}</span>
        </div>
    );
}

function StatusPill({ status }) {
    const config = {
        completed: { label: 'Complété', cls: 'bg-emerald-50 text-emerald-700' },
        sent: { label: 'Envoyé', cls: 'bg-sky-50 text-sky-700' },
        pending: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
        failed: { label: 'Échoué', cls: 'bg-rose-50 text-rose-700' },
        responded: { label: 'Répondu', cls: 'bg-indigo-50 text-indigo-700' },
    };
    const c = config[status] || { label: status || '—', cls: 'bg-gray-50 text-gray-500' };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.cls}`}>{c.label}</span>;
}

function GoalRow({ label, current, target, unit }) {
    const progress = Math.min(100, Math.round((current / target) * 100));
    const isGood = progress >= 80;
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{label}</span>
                <span className="text-xs font-medium text-gray-900">{current}{unit} / {target}{unit}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isGood ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
