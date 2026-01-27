import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';

export default function RadarIA({ auth, stats, analysis, lastUpdated }) {
    const [loading, setLoading] = useState(false);
    const total = stats?.total || 0;
    const positiveRate = stats?.positiveRate || 0;
    const negativeRate = stats?.negativeRate || 0;
    const neutralRate = total > 0 ? Math.max(0, 100 - positiveRate - negativeRate) : 0;

    useEffect(() => {
        const start = () => setLoading(true);
        const finish = () => setLoading(false);

        const offStart = router.on('start', start);
        const offFinish = router.on('finish', finish);

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    return (
        <AuthenticatedLayout user={auth.user} header="Radar IA">
            <Head title="Radar IA" />

            <div className="space-y-6">
                {loading && (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                        <Spinner />
                        <span>Analyse en cours… merci de patienter quelques secondes.</span>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analyse Radar IA</h1>
                        <p className="text-sm text-gray-600">Synthèse professionnelle des feedbacks clients</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        analysis?.cached 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-indigo-50 text-indigo-700'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${analysis?.cached ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`} />
                        {analysis?.cached ? '✓ Mise en cache' : 'Analyse en cours'}
                    </div>
                </div>

                {/* Indicateur de cache */}
                {analysis?.cached && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 text-sm">
                        <strong>✅ Analyse en cache:</strong> Les mêmes feedbacks génèrent instantanément la même analyse. 
                        <span className="block text-xs mt-1 opacity-75">Mise en cache depuis {analysis?.cached_at}</span>
                    </div>
                )}

                {analysis?.status === 'fallback' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
                        <strong>Mode local:</strong> {analysis?.note || 'Analyse IA indisponible, affichage d’une analyse locale.'}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Feedbacks analysés" value={total} tone="blue" />
                    <StatCard title="Positifs" value={stats?.positive || 0} tone="emerald" />
                    <StatCard title="Négatifs" value={stats?.negative || 0} tone="rose" />
                    <StatCard title="Neutres" value={stats?.neutral || 0} tone="amber" />
                </div>

                {/* Key Issues Only */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Liste des problèmes à résoudre</h3>
                        <span className="text-xs text-gray-500">Confiance: {analysis?.confidence || '—'}</span>
                    </div>
                    {analysis?.keyIssues?.length ? (
                        <ul className="mt-4 space-y-3">
                            {analysis.keyIssues.map((issue, idx) => (
                                <li key={`${issue.title}-${idx}`} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{issue.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{issue.detail}</p>
                                        </div>
                                        <div className="text-right">
                                            <ImpactBadge impact={issue.impact} />
                                            <p className="text-xs text-gray-500 mt-2">{issue.count || 0} mentions</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-gray-500">Aucun problème majeur détecté pour l’instant.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, tone }) {
    const tones = {
        blue: 'from-blue-500 to-indigo-600',
        emerald: 'from-emerald-500 to-teal-600',
        rose: 'from-rose-500 to-pink-600',
        amber: 'from-amber-400 to-orange-500',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">{title}</p>
            <div className="flex items-center justify-between mt-3">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tones[tone]} opacity-90`} />
            </div>
        </div>
    );
}

function ImpactBadge({ impact }) {
    const map = {
        faible: 'bg-green-100 text-green-700',
        moyen: 'bg-amber-100 text-amber-700',
        fort: 'bg-rose-100 text-rose-700',
    };
    const tone = map[impact] || 'bg-gray-100 text-gray-600';

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>
            {impact || '—'}
        </span>
    );
}

function Spinner() {
    return (
        <span className="relative flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-50" />
            <span className="relative inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </span>
    );
}
