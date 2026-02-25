import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart,
} from 'recharts';
import { usePage } from '@inertiajs/react';

export default function Analytics({ auth }) {
    const {
        ratings,
        ratingsTotal,
        sources,
        trend,
        qualityIndex,
        evolQualityIndex,
        avgRating,
        evolRating,
        totalFeedbacks,
        evolFeedbacks,
        completionRate,
        evolCompletion,
        avgProcessingTime,
        evolProcessing,
    } = usePage().props;

    const totalRequests = totalFeedbacks ?? 0;
    const responseDelta = evolRating ? parseFloat(evolRating) : 0;
    const requestsDelta = evolFeedbacks ? parseFloat(evolFeedbacks) : 0;
    const ratingDistribution = ratings || {};
    const channelData = sources || {};
    return (
        <AuthenticatedLayout user={auth?.user} header="Analytics">
            <Head title="Analytics" />

            <div className="space-y-8">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 p-8 text-white shadow-2xl">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex flex-col gap-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            Insights avancés
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">Analytics Business</h1>
                        <p className="max-w-2xl text-indigo-100/90">
                            Analysez la performance commerciale, la qualité de service et l'efficacité opérationnelle de vos campagnes.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('feedbacks.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg hover:shadow-xl"
                            >
                                Voir les feedbacks
                            </Link>
                            <Link
                                href={route('radar')}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl"
                            >
                                Radar IA
                            </Link>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title="Taux de réponse" value={`${avgRating ?? 0}`} helper="global" tone="emerald" delta={responseDelta} />
                    <KpiCard title="Demandes (30j)" value={totalFeedbacks ?? 0} helper="vs 30j" tone="indigo" delta={requestsDelta} />
                    <KpiCard title="Temps moyen" value={avgProcessingTime ? `${avgProcessingTime}h` : '—'} helper="réponse" tone="blue" />
                    <KpiCard title="Note moyenne" value={avgRating ?? '—'} helper="qualité" tone="amber" />
                </div>

                {/* Operational Summary */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Indice de Qualité</h2>
                                <p className="text-sm text-gray-500">Performance globale</p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                                {qualityIndex ?? '--'}
                            </span>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <MiniStat label="Positifs" value={ratings?.[5] ? ratings[5] + ratings[4] : 0} sub={`${ratingDistribution[5] ? Math.round((ratingDistribution[5] / ratingsTotal) * 100) : 0}%`} />
                            <MiniStat label="Neutres" value={ratings?.[3] ?? 0} sub={`${ratingDistribution[3] ? Math.round((ratingDistribution[3] / ratingsTotal) * 100) : 0}%`} />
                            <MiniStat label="Négatifs" value={ratings?.[2] ? ratings[2] + ratings[1] : 0} sub={`${ratingDistribution[2] ? Math.round((ratingDistribution[2] / ratingsTotal) * 100) : 0}%`} />
                        </div>
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Performance par canal</h4>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {['email', 'sms', 'qr'].map((channel) => (
                                    <ChannelPerformanceCard
                                        key={channel}
                                        label={channel.toUpperCase()}
                                        value={channelData?.[channel] ?? 0}
                                        total={totalRequests}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900">Statistiques Clés</h3>
                        <p className="text-sm text-gray-500">Résumé des performances</p>
                        <div className="mt-6 space-y-4">
                            <StatRow label="Taux de complétion" value={`${completionRate ?? 0}%`} change={evolCompletion} />
                            <StatRow label="Temps moyen (h)" value={avgProcessingTime ?? '—'} change={evolProcessing ? -evolProcessing : 0} />
                            <StatRow label="Évolution qualité" value={`${qualityIndex ?? 0}`} change={evolQualityIndex} />
                        </div>
                    </div>
                </div>

                {/* Pro Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Répartition des notes - Donut Chart */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900">Répartition des notes</h3>
                        <p className="text-sm text-gray-500">Distribution par nombre d'étoiles</p>
                        <div className="mt-6">
                            <RatingDistributionChart data={ratingDistribution} />
                        </div>
                    </div>

                    {/* Sources des feedbacks - Bar Chart Horizontal */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900">Sources des feedbacks</h3>
                        <p className="text-sm text-gray-500">Répartition par canal d'acquisition</p>
                        <div className="mt-6">
                            <ChannelsDistributionChart data={channelData} />
                        </div>
                    </div>
                </div>

                {/* Évolution des notes - Line Chart */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900">Évolution des notes</h3>
                    <p className="text-sm text-gray-500">Note moyenne et nombre de feedbacks sur les 30 derniers jours</p>
                    <div className="mt-6">
                        <RatingTrendChart data={trend} />
                    </div>
                </div>

                {/* Trends */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900">Tendance des demandes</h3>
                        <p className="text-sm text-gray-500">30 derniers jours</p>
                        <div className="mt-6">
                            <TrendBars data={trend} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900">Canaux (texte)</h3>
                        <p className="text-sm text-gray-500">Répartition par canal</p>
                        <div className="mt-6 space-y-4">
                            <ChannelRow label="Email" value={channelData?.email ?? 0} total={totalRequests} color="from-blue-500 to-indigo-500" />
                            <ChannelRow label="SMS" value={channelData?.sms ?? 0} total={totalRequests} color="from-emerald-500 to-teal-500" />
                            <ChannelRow label="QR" value={channelData?.qr ?? 0} total={totalRequests} color="from-purple-500 to-fuchsia-500" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function KpiCard({ title, value, helper, tone, delta }) {
    const tones = {
        emerald: 'from-emerald-500 to-teal-500',
        blue: 'from-blue-500 to-indigo-500',
        purple: 'from-purple-500 to-fuchsia-500',
        amber: 'from-amber-500 to-orange-500',
        indigo: 'from-indigo-500 to-violet-500',
    };

    const deltaLabel = typeof delta === 'number'
        ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
        : null;
    const deltaTone = delta > 0 ? 'text-emerald-700 bg-emerald-50' : delta < 0 ? 'text-rose-700 bg-rose-50' : 'text-gray-600 bg-gray-50';

    return (
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
                    <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-gray-500">{helper}</p>
                        {deltaLabel && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${deltaTone}`}>
                                {deltaLabel}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tones[tone]} shadow-lg`} />
            </div>
        </div>
    );
}

function MiniStat({ label, value, sub }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
    );
}

function StatRow({ label, value, change }) {
    const changeColor = change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-gray-500';
    
    return (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            <div className="text-right">
                <p className="text-lg font-black text-gray-900">{value}</p>
                {change !== undefined && change !== 0 && (
                    <p className={`text-xs ${changeColor}`}>
                        {change > 0 ? '+' : ''}{change}
                    </p>
                )}
            </div>
        </div>
    );
}

function ChannelPerformanceCard({ label, value, total }) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-semibold text-gray-500">{percentage}%</span>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
            <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

function TrendBars({ data }) {
    if (!data?.length) return <p className="text-sm text-gray-500">Aucune donnée disponible.</p>;

    const max = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="flex items-end gap-2 h-44">
            {data.map((point) => {
                const height = Math.round((point.count / max) * 100);
                return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-50 rounded-t-xl h-32 flex items-end">
                            <div
                                className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg"
                                style={{ height: `${height}%` }}
                                title={`${point.count} demandes`}
                            />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400">{point.date.slice(5)}</span>
                    </div>
                );
            })}
        </div>
    );
}

function ChannelRow({ label, value, total, color }) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">{label}</span>
                <span className="text-gray-500">{percentage}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

// Composants Recharts Professionnels

function RatingDistributionChart({ data }) {
    const chartData = [
        { name: '5 étoiles', value: data[5] || 0, fill: '#10b981' },
        { name: '4 étoiles', value: data[4] || 0, fill: '#3b82f6' },
        { name: '3 étoiles', value: data[3] || 0, fill: '#f59e0b' },
        { name: '2 étoiles', value: data[2] || 0, fill: '#ef4444' },
        { name: '1 étoile', value: data[1] || 0, fill: '#991b1b' },
    ].filter(d => d.value > 0);

    const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            const percentage = Math.round((data.value / total) * 100);
            return (
                <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff'
                }}>
                    <p style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>
                        {data.name}
                    </p>
                    <p style={{ color: '#e5e7eb', margin: 0, fontSize: '12px' }}>
                        {data.value} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-2 gap-3">
                {chartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-gray-600">{d.name}</span>
                        <span className="ml-auto font-semibold text-gray-900">{Math.round((d.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChannelsDistributionChart({ data }) {
    const chartData = [
        { name: 'SMS', value: data?.sms || 0 },
        { name: 'QR Code', value: data?.qr || 0 },
        { name: 'Email', value: data?.email || 0 },
    ].sort((a, b) => b.value - a.value);

    const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1;

    const colors = ['#1e293b', '#3b82f6', '#64748b'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload[0]) {
            const data = payload[0].payload;
            const percentage = Math.round((data.value / total) * 100);
            return (
                <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#ffffff'
                }}>
                    <p style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>
                        {data.name}
                    </p>
                    <p style={{ color: '#e5e7eb', margin: 0, fontSize: '12px' }}>
                        {data.value} feedbacks ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis type="category" dataKey="name" stroke="#6b7280" width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#1e293b" radius={[0, 8, 8, 0]} />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
                {chartData.map((d, idx) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[idx] }} />
                            <span className="text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{d.value} ({Math.round((d.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RatingTrendChart({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500">Aucune donnée disponible.</p>;
    }

    const chartData = data.map(d => ({
        date: d.date.slice(5),
        rating: d.avg_rating || 0,
        feedback_count: d.count || 0,
    }));

    return (
        <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                />
                <YAxis 
                    yAxisId="left" 
                    stroke="#6b7280"
                    label={{ value: 'Note moyenne', angle: -90, position: 'insideLeft' }}
                    domain={[0, 5]}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="#6b7280"
                    label={{ value: 'Nombre de feedbacks', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(31, 41, 55, 0.98)', 
                        border: '1px solid #374151', 
                        borderRadius: '8px', 
                        color: '#fff',
                        padding: '8px 12px'
                    }}
                    labelStyle={{ color: '#fff', fontSize: '12px' }}
                    formatter={(value) => value.toFixed(2)}
                />
                <Legend />
                <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#f59e0b" 
                    name="Note moyenne"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                    activeDot={{ r: 7 }}
                />
                <Bar 
                    yAxisId="right"
                    dataKey="feedback_count" 
                    fill="#3b82f6" 
                    name="Feedbacks"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
