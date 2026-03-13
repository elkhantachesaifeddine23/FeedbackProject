import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText, Download, TrendingUp, AlertCircle, Target, Lightbulb,
    BarChart3, Brain, Globe, Zap, CheckCircle2, Clock, AlertTriangle,
    MessageSquare, Star, ShieldAlert, ArrowRight, Sparkles, ListChecks,
    Reply, CircleDot, Flame, ChevronRight, Users, ThumbsDown, Wrench,
    Gauge, Activity, TriangleAlert, CircleCheck, Check, RotateCcw
} from 'lucide-react';

/* ─────────────────────────  Sub-components  ───────────────────────── */

function SentimentDonut({ positive = 0, neutral = 0, negative = 0 }) {
    const total = Math.max(positive + neutral + negative, 1);
    const r = 16, c = 2 * Math.PI * r;
    const seg = v => (v / total) * c;
    const pLen = seg(positive), nLen = seg(neutral), ngLen = seg(negative);

    return (
        <div className="flex items-center gap-5">
            <div className="relative">
                <svg width="110" height="110" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle cx="20" cy="20" r={r} fill="none" stroke="#10b981" strokeWidth="5"
                        strokeDasharray={`${pLen} ${c - pLen}`} strokeDashoffset="0" transform="rotate(-90 20 20)" />
                    <circle cx="20" cy="20" r={r} fill="none" stroke="#f59e0b" strokeWidth="5"
                        strokeDasharray={`${nLen} ${c - nLen}`} strokeDashoffset={-pLen} transform="rotate(-90 20 20)" />
                    <circle cx="20" cy="20" r={r} fill="none" stroke="#ef4444" strokeWidth="5"
                        strokeDasharray={`${ngLen} ${c - ngLen}`} strokeDashoffset={-(pLen + nLen)} transform="rotate(-90 20 20)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{positive + neutral + negative}</span>
                    <span className="text-[10px] text-gray-500 font-medium">avis</span>
                </div>
            </div>
            <div className="space-y-2 flex-1">
                {[['Positif', positive, 'bg-emerald-500'], ['Neutre', neutral, 'bg-amber-500'], ['Négatif', negative, 'bg-red-500']].map(([l, v, bg]) => (
                    <div key={l} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${bg}`} /><span className="text-sm text-gray-600">{l}</span></div>
                        <span className="text-sm font-semibold text-gray-900">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MiniKPI({ icon: Icon, label, value, sub, color = 'indigo' }) {
    const colors = {
        indigo: ['bg-indigo-50', 'text-indigo-600'],
        emerald: ['bg-emerald-50', 'text-emerald-600'],
        rose: ['bg-rose-50', 'text-rose-600'],
        amber: ['bg-amber-50', 'text-amber-600'],
        violet: ['bg-violet-50', 'text-violet-600'],
    };
    const [bgC, textC] = colors[color] || colors.indigo;

    return (
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${bgC}`}>
                    <Icon className={`w-5 h-5 ${textC}`} />
                </div>
                {sub && <span className="text-xs text-gray-400 font-medium">{sub}</span>}
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}

function TrendCard({ label, value, delta, unit = '', inverse = false }) {
    const d = typeof delta === 'number' ? delta : null;
    const isPos = d !== null ? d >= 0 : null;
    const tone = isPos === null ? 'text-gray-400' : (inverse ? !isPos : isPos) ? 'text-emerald-600' : 'text-rose-600';

    return (
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <div className="flex items-end justify-between mt-2">
                <p className="text-xl font-bold text-gray-900">{typeof value === 'number' ? `${value}${unit}` : '—'}</p>
                {d !== null
                    ? <span className={`text-xs font-semibold ${tone}`}>{d >= 0 ? '▲' : '▼'} {Math.abs(d)}{unit}</span>
                    : <span className="text-xs text-gray-300">—</span>}
            </div>
        </div>
    );
}

function ChannelBars({ channels }) {
    if (!channels?.length) return <p className="text-sm text-gray-400">Aucune donnée.</p>;
    const max = Math.max(...channels.map(c => c.count), 1);
    return (
        <div className="space-y-3">
            {channels.map(c => (
                <div key={c.channel}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="uppercase tracking-wide font-medium">{c.channel}</span>
                        <span className="font-semibold text-gray-900">{c.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${Math.round((c.count / max) * 100)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function HealthGauge({ score }) {
    const v = typeof score === 'number' ? score : 0;
    const color = v >= 80 ? 'text-emerald-500' : v >= 60 ? 'text-amber-500' : 'text-rose-500';
    const label = v >= 80 ? 'Excellent' : v >= 60 ? 'Correct' : 'Critique';

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" className={color} stroke="currentColor" strokeWidth="3"
                        strokeDasharray={`${v} ${100 - v}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${color}`}>{v}</span>
                    <span className="text-[10px] text-gray-400 font-medium">/100</span>
                </div>
            </div>
            <span className={`mt-2 text-xs font-bold ${color}`}>{label}</span>
        </div>
    );
}

function SeverityBadge({ severity }) {
    const s = (severity || '').toLowerCase();
    const map = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[s] || map.low}`}>{s === 'high' ? 'Élevé' : s === 'medium' ? 'Moyen' : 'Faible'}</span>;
}

function CategoryBadge({ category }) {
    const c = (category || '').toLowerCase();
    const map = { risk: 'bg-rose-100 text-rose-700', ops: 'bg-blue-100 text-blue-700', opportunity: 'bg-violet-100 text-violet-700' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[c] || map.opportunity}`}>{c === 'risk' ? 'Risque' : c === 'ops' ? 'Ops' : 'Opportunité'}</span>;
}

function UrgencyBadge({ urgency }) {
    const u = (urgency || '').toLowerCase();
    if (u.includes('imm')) return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 animate-pulse">Immédiat</span>;
    if (u.includes('court')) return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">Court terme</span>;
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">Moyen terme</span>;
}

function ImpactBadge({ impact }) {
    const i = (impact || '').toLowerCase();
    if (i.includes('fort') || i.includes('high')) return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Impact fort</span>;
    if (i.includes('moyen') || i.includes('medium')) return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Impact moyen</span>;
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">Impact faible</span>;
}

function EffortBadge({ effort }) {
    const e = (effort || '').toLowerCase();
    if (e.includes('faible') || e.includes('low')) return <span className="text-[11px] font-medium text-emerald-600">⚡ Effort faible</span>;
    if (e.includes('moyen') || e.includes('medium')) return <span className="text-[11px] font-medium text-amber-600">⏳ Effort moyen</span>;
    return <span className="text-[11px] font-medium text-rose-600">🔧 Effort élevé</span>;
}

function Spinner() {
    return (
        <span className="relative flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-40" />
            <span className="relative inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </span>
    );
}

/* ─────────────────────────  MAIN COMPONENT  ───────────────────────── */

export default function RadarIA({
    auth,
    stats,
    analysis,
    lastUpdated,
    period,
    trends,
    signals,
    recommendedActions,
    channels,
    benchmarks,
    healthScore,
    operationalData = {},
    feedbackSummary = {},
    unresolvedNegative = [],
    detectedProblems = [],
    detectedDecisions = [],
}) {
    const [loading, setLoading] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [resolvingId, setResolvingId] = useState(null);

    const total = stats?.total || 0;
    const positiveRate = stats?.positiveRate || 0;
    const negativeRate = stats?.negativeRate || 0;

    const tasks = operationalData?.tasks || {};
    const replies = operationalData?.replies || {};
    const resolution = operationalData?.resolution || {};
    const google = operationalData?.google || {};

    const summary = feedbackSummary?.summary || null;
    // Use DB-backed detected items instead of raw IA output
    const decisions = detectedDecisions;
    const problems = detectedProblems;

    useEffect(() => {
        const s = () => setLoading(true);
        const f = () => setLoading(false);
        const off1 = router.on('start', s);
        const off2 = router.on('finish', f);
        return () => { off1(); off2(); };
    }, []);

    const handleCreateTask = (action) => {
        if (!action?.title) return;
        const p = (action.priority || '').toUpperCase();
        const importance = p === 'P0' ? 'high' : p === 'P1' ? 'medium' : 'low';
        const lines = [];
        if (action.context?.signal_title) lines.push(`Signal: ${action.context.signal_title}`);
        if (action.context?.signal_detail) lines.push(`Détail: ${action.context.signal_detail}`);
        if (Array.isArray(action.context?.evidence) && action.context.evidence.length)
            action.context.evidence.slice(0, 3).forEach(e => lines.push(`- ${e}`));
        setCreatingTask(true);
        router.post(route('tasks.store'), { title: action.title, description: [action.detail, ...lines].filter(Boolean).join('\n') || null, importance }, { preserveScroll: true, onFinish: () => setCreatingTask(false) });
    };

    const handleCreateTaskFromDecision = (decision) => {
        setCreatingTask(true);
        router.post(route('tasks.store'), {
            title: decision.title,
            description: `${decision.detail || ''}\n\nImpact: ${decision.impact || 'N/A'}\nUrgence: ${decision.urgency || 'N/A'}`.trim(),
            importance: (decision.urgency || '').toLowerCase().includes('imm') ? 'high' : 'medium',
        }, { preserveScroll: true, onFinish: () => setCreatingTask(false) });
    };

    const handleCreateTaskFromProblem = (problemId) => {
        if (resolvingId) return;
        setResolvingId(problemId);
        router.post(route('radar.problems.createTask', { id: problemId }), {}, {
            preserveScroll: true,
            onFinish: () => setResolvingId(null),
        });
    };

    const handleExportPdf = () => {
        setExportingPdf(true);
        window.location.assign(route('radar.export.pdf', { days: period?.days ?? 30 }));
        setTimeout(() => setExportingPdf(false), 2500);
    };

    const handleResolve = (id) => {
        if (resolvingId) return;
        setResolvingId(id);
        router.post(route('radar.problems.resolve', { id }), {}, {
            preserveScroll: true,
            onFinish: () => setResolvingId(null),
        });
    };

    const handleReopen = (id) => {
        if (resolvingId) return;
        setResolvingId(id);
        router.post(route('radar.problems.reopen', { id }), {}, {
            preserveScroll: true,
            onFinish: () => setResolvingId(null),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Radar IA">
            <Head title="Radar IA - Intelligence Décisionnelle" />

            <div className="space-y-8 pb-12">

                {/* ═══════════════ HERO HEADER ═══════════════ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-8 shadow-2xl">
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3), transparent 50%)' }} />
                    <div className="absolute top-4 right-4 flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                        ))}
                    </div>

                    <div className="relative flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-5">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                                <Brain className="w-9 h-9 text-indigo-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl font-black text-white tracking-tight">Radar IA</h1>
                                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg">
                                        INTELLIGENCE DÉCISIONNELLE
                                    </span>
                                </div>
                                <p className="mt-2 text-white/70 text-sm max-w-lg">
                                    Analyse intelligente de vos feedbacks, détection de problèmes, et recommandations stratégiques pour piloter votre expérience client.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-white/40">Période analysée</p>
                                <p className="text-white font-bold">{period?.days ?? 30} jours</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/40">Dernière mise à jour</p>
                                <p className="text-white/80 text-sm font-medium">{lastUpdated || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Export buttons inside hero */}
                    <div className="relative mt-6 flex items-center gap-3">
                        <button onClick={() => window.location.assign(route('radar.export', { days: period?.days ?? 30 }))}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition border border-white/20">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={handleExportPdf} disabled={exportingPdf}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition shadow-lg disabled:opacity-50">
                            {exportingPdf
                                ? <><div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div> Génération...</>
                                : <><FileText className="w-4 h-4" /> Rapport PDF</>}
                        </button>
                    </div>
                </div>

                {/* Status banners */}
                {loading && (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm text-indigo-700">
                        <Spinner /> Analyse IA en cours…
                    </div>
                )}
                {analysis?.cached && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> <strong>Analyse en cache</strong> — Résultats instantanés depuis {analysis?.cached_at}
                    </div>
                )}
                {analysis?.status === 'fallback' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> <strong>Mode local</strong> — {analysis?.note || "IA indisponible, analyse locale affichée."}
                    </div>
                )}


                {/* ═══════════════ AI FEEDBACK SUMMARY ═══════════════ */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/30 p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-50" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-xl shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Synthèse IA de vos Feedbacks</h2>
                                <p className="text-sm text-gray-500">Résumé automatique généré par intelligence artificielle</p>
                            </div>
                        </div>

                        {summary ? (
                            <div className="bg-white rounded-xl p-6 border border-indigo-100 shadow-sm">
                                <p className="text-gray-700 leading-relaxed text-[15px]">{summary}</p>
                            </div>
                        ) : (
                            <div className="bg-white/60 rounded-xl p-6 border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm italic">Aucune synthèse disponible pour le moment. Collectez plus de feedbacks pour activer l'analyse IA.</p>
                            </div>
                        )}
                    </div>
                </div>


                {/* ═══════════════ OPERATIONAL DASHBOARD ═══════════════ */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-gray-900">Tableau de bord opérationnel</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MiniKPI icon={ListChecks} label="Tâches ouvertes" value={tasks.open ?? 0} sub={`/${tasks.total ?? 0}`} color="indigo" />
                        <MiniKPI icon={Flame} label="Tâches critiques" value={tasks.critical ?? 0} sub={tasks.overdue ? `${tasks.overdue} en retard` : null} color="rose" />
                        <MiniKPI icon={MessageSquare} label="Réponses IA" value={replies.ai ?? 0} sub={`${replies.total ?? 0} total`} color="violet" />
                        <MiniKPI icon={Reply} label="Sans réponse" value={replies.unanswered ?? 0} color="amber" />
                        <MiniKPI icon={CircleCheck} label="Taux résolution" value={`${resolution.rate ?? 0}%`} sub={`${resolution.resolved ?? 0} résolus`} color="emerald" />
                        <MiniKPI icon={Star} label="Avis Google" value={google.reviews_count ?? 0} sub={google.connected ? '✓ Connecté' : '✗ Non connecté'} color="amber" />
                    </div>
                </div>


                {/* ═══════════════ AI DECISIONS ═══════════════ */}
                {decisions.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold text-gray-900">Décisions recommandées par l'IA</h2>
                            <span className="ml-auto text-xs text-gray-400 font-medium">{decisions.length} décision{decisions.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {decisions.map((d) => (
                                <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-xl" />
                                    <div className="ml-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <UrgencyBadge urgency={d.urgency} />
                                                    <ImpactBadge impact={d.impact} />
                                                    {d.feedbacks_count > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                                                            {d.feedbacks_count} feedback{d.feedbacks_count > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm">{d.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{d.detail}</p>
                                                {d.created_at && (
                                                    <p className="text-[11px] text-gray-400 mt-2">Détecté le {d.created_at}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleCreateTaskFromProblem(d.id)}
                                                    disabled={resolvingId === d.id}
                                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100 disabled:opacity-30"
                                                    title="Créer une tâche"
                                                >
                                                    {resolvingId === d.id ? <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" /> : <ListChecks className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* ═══════════════ AI PROBLEMS & SOLUTIONS ═══════════════ */}
                {problems.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Wrench className="w-5 h-5 text-rose-500" />
                            <h2 className="text-lg font-bold text-gray-900">Problèmes détectés & Solutions</h2>
                            <span className="ml-auto text-xs text-gray-400 font-medium">{problems.length} problème{problems.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {problems.map((p) => (
                                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-red-500 rounded-l-xl" />
                                    <div className="ml-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    <TriangleAlert className="w-4 h-4 text-rose-500 shrink-0" />
                                                    {p.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">{p.detail}</p>

                                                {p.solution && (
                                                    <div className="mt-3 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                                        <p className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Solution proposée
                                                        </p>
                                                        <p className="text-sm text-emerald-800">{p.solution}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                    <EffortBadge effort={p.effort} />
                                                    <ImpactBadge impact={p.impact} />
                                                    {p.feedbacks_count > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                                                            {p.feedbacks_count} feedback{p.feedbacks_count > 1 ? 's' : ''} liés
                                                        </span>
                                                    )}
                                                </div>
                                                {p.created_at && (
                                                    <p className="text-[11px] text-gray-400 mt-2">Détecté le {p.created_at}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleCreateTaskFromProblem(p.id)}
                                                    disabled={resolvingId === p.id}
                                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100 disabled:opacity-30"
                                                    title="Créer une tâche"
                                                >
                                                    {resolvingId === p.id ? <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" /> : <ListChecks className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* ═══════════════ UNRESOLVED NEGATIVE FEEDBACKS ═══════════════ */}
                {unresolvedNegative.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-rose-50/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-rose-100 p-2.5 rounded-lg">
                                    <ThumbsDown className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Feedbacks négatifs non résolus</h2>
                                    <p className="text-sm text-gray-500">{unresolvedNegative.length} avis nécessitant une attention immédiate</p>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {unresolvedNegative.map((fb, i) => (
                                <div key={i} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="shrink-0 mt-0.5">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, s) => (
                                                    <Star key={s} className={`w-3.5 h-3.5 ${s < (fb.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-gray-900">{fb.customer}</span>
                                                <span className="text-xs text-gray-400">{fb.date}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{fb.comment}</p>
                                        </div>
                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                                            Non résolu
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* ═══════════════ KPI + SENTIMENT ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MiniKPI icon={BarChart3} label="Feedbacks analysés" value={total} color="indigo" />
                            <MiniKPI icon={TrendingUp} label="Positifs" value={stats?.positive || 0} sub={`${positiveRate.toFixed(0)}%`} color="emerald" />
                            <MiniKPI icon={AlertCircle} label="Négatifs" value={stats?.negative || 0} sub={`${negativeRate.toFixed(0)}%`} color="rose" />
                            <MiniKPI icon={CircleDot} label="Neutres" value={stats?.neutral || 0} color="amber" />
                        </div>

                        {/* Executive Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-500" /> Résumé exécutif
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">Analyse consolidée par l'IA</p>
                            <p className="mt-4 text-gray-700 leading-relaxed">{analysis?.summary || 'Aucune analyse disponible.'}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h3 className="text-base font-bold text-gray-900 mb-1">Sentiment Global</h3>
                        <p className="text-xs text-gray-400 mb-4">Répartition des avis</p>
                        <SentimentDonut positive={stats?.positive || 0} neutral={stats?.neutral || 0} negative={stats?.negative || 0} />
                    </div>
                </div>


                {/* ═══════════════ TRENDS + HEALTH SCORE ═══════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Tendances clés</h3>
                            <span className="text-xs text-gray-400">vs période précédente</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <TrendCard label="Taux positif" value={trends?.positiveRate?.current} delta={trends?.positiveRate?.delta} unit="%" />
                            <TrendCard label="Taux négatif" value={trends?.negativeRate?.current} delta={trends?.negativeRate?.delta} unit="%" inverse />
                            <TrendCard label="Taux réponse" value={trends?.responseRate?.current} delta={trends?.responseRate?.delta} unit="%" />
                            <TrendCard label="Note moyenne" value={trends?.avgRating?.current} delta={trends?.avgRating?.delta} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h3 className="text-base font-bold text-gray-900 mb-1">Health Score</h3>
                        <p className="text-xs text-gray-400 mb-3">Score global (0–100)</p>
                        <HealthGauge score={healthScore?.score} />
                        {healthScore?.drivers && (
                            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-[11px] text-gray-500">
                                <div>Note: <span className="font-bold text-gray-700">{healthScore.drivers.rating_score ?? '—'}</span></div>
                                <div>Négatif: <span className="font-bold text-gray-700">{healthScore.drivers.negative_penalty ?? '—'}</span></div>
                                <div>Réponse: <span className="font-bold text-gray-700">{healthScore.drivers.response_penalty ?? '—'}</span></div>
                                <div>Échecs: <span className="font-bold text-gray-700">{healthScore.drivers.failed_penalty ?? '—'}</span></div>
                            </div>
                        )}
                    </div>
                </div>


                {/* ═══════════════ BENCHMARKS ═══════════════ */}
                {benchmarks && Object.keys(benchmarks).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-1">Benchmarks internes</h3>
                        <p className="text-xs text-gray-400 mb-4">Comparaison anonyme vs médiane plateforme</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-100">
                                        <th className="py-2.5 pr-4 font-medium">Métrique</th>
                                        <th className="py-2.5 pr-4 font-medium">Vous</th>
                                        <th className="py-2.5 pr-4 font-medium">Médiane</th>
                                        <th className="py-2.5 font-medium">Percentile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(benchmarks).map((b) => (
                                        <tr key={b.label} className="border-t border-gray-50 hover:bg-gray-50/50">
                                            <td className="py-3 pr-4 font-semibold text-gray-800">{b.label}</td>
                                            <td className="py-3 pr-4 text-gray-700">{b.company ?? '—'}</td>
                                            <td className="py-3 pr-4 text-gray-700">{b.median ?? '—'}</td>
                                            <td className="py-3">
                                                {b.percentile !== null ? (
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${b.percentile >= 75 ? 'bg-emerald-100 text-emerald-700' : b.percentile >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {b.percentile}%
                                                    </span>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {/* ═══════════════ CHANNELS ═══════════════ */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Canaux de collecte</h3>
                    <p className="text-xs text-gray-400 mb-4">Distribution des feedbacks par canal ({period?.days ?? 30}j)</p>
                    <ChannelBars channels={channels} />
                </div>




            </div>
        </AuthenticatedLayout>
    );
}
