import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

export default function Analytics() {
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
    // Donut chart: Répartition des notes
    const donutData = {
                        labels: ['5 étoiles', '4 étoiles', '3 étoiles', '2 étoiles', '1 étoile'],
                        datasets: [
                            {
                                data: [ratings[5], ratings[4], ratings[3], ratings[2], ratings[1]],
                                backgroundColor: ['#111827', '#374151', '#6B7280', '#A1A1AA', '#E5E7EB'],
                                borderWidth: 0,
                            },
                        ],
                    };

                    // Bar chart: Sources des feedbacks
                    const barLabels = ['SMS', 'QR Code', 'Email'];
                    const barData = {
                        labels: barLabels,
                        datasets: [
                            {
                                label: 'Feedbacks',
                                data: [sources.sms || 0, sources.qr || 0, sources.email || 0],
                                backgroundColor: '#0f172a',
                                borderRadius: 8,
                                barThickness: 32,
                            },
                        ],
                    };

                    // Line chart: Évolution des notes
                    const lineLabels = trend.map(t => t.date.substr(5)); // Format MM-DD
                    const lineData = {
                        labels: lineLabels,
                        datasets: [
                            {
                                label: 'Note moyenne',
                                data: trend.map(t => t.avg_rating ?? null),
                                borderColor: '#1e3a8a', // dark blue
                                backgroundColor: 'rgba(30,58,138,0.15)', // dark blue with transparency
                                pointBackgroundColor: '#1e3a8a',
                                pointBorderColor: '#fff',
                                pointRadius: 6,
                                pointHoverRadius: 8,
                                tension: 0.4, // courbe lisse
                                fill: true,
                                showLine: true,
                                spanGaps: true,
                            },
                        ],
                    };

                    // Calcul des pourcentages
                    const percent = star => ratingsTotal > 0 ? Math.round((ratings[star] / ratingsTotal) * 100) : 0;

                    return (
                        <AuthenticatedLayout header="Analytics">
                            <Head title="Analytics" />
                            <div className="py-8">
                                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                    {/* Statistiques qualité */}
                                    <div className="mb-8">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Statistiques</h1>
                                        <p className="text-sm text-gray-500 mb-6">Analysez vos performances et l'évolution de votre réputation</p>
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                            {/* Quality Index */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                                <div className="text-4xl font-bold text-yellow-600 mb-1">{qualityIndex ?? '--'}</div>
                                                <div className="text-sm text-gray-700 mb-2">Luminea Quality Index™</div>
                                                <div className="text-xs text-yellow-700 bg-yellow-100 rounded-full px-3 py-1 mt-2">{evolQualityIndex !== null ? `${evolQualityIndex > 0 ? '+' : ''}${evolQualityIndex} pts vs période précédente` : '--'}</div>
                                            </div>
                                            {/* Note moyenne */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                                <div className="text-3xl font-bold text-gray-900 mb-1">{avgRating ?? '--'}</div>
                                                <div className="text-sm text-gray-700 mb-2">Note moyenne</div>
                                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{evolRating !== null ? `${evolRating > 0 ? '+' : ''}${evolRating}` : '--'}</div>
                                            </div>
                                            {/* Total feedbacks */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                                <div className="text-3xl font-bold text-gray-900 mb-1">{totalFeedbacks ?? '--'}</div>
                                                <div className="text-sm text-gray-700 mb-2">Total feedbacks</div>
                                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{evolFeedbacks !== null ? `${evolFeedbacks > 0 ? '+' : ''}${evolFeedbacks}%` : '--'}</div>
                                            </div>
                                            {/* Taux de complétion */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                                <div className="text-3xl font-bold text-gray-900 mb-1">{completionRate !== null ? `${completionRate}%` : '--'}</div>
                                                <div className="text-sm text-gray-700 mb-2">Taux de complétion</div>
                                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{evolCompletion !== null ? `${evolCompletion > 0 ? '+' : ''}${evolCompletion}%` : '--'}</div>
                                            </div>
                                            {/* Temps de traitement */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                                <div className="text-3xl font-bold text-gray-900 mb-1">{avgProcessingTime !== null ? `${avgProcessingTime}h` : '--'}</div>
                                                <div className="text-sm text-gray-700 mb-2">Temps de traitement</div>
                                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{evolProcessing !== null ? `${evolProcessing > 0 ? '-' : ''}${Math.abs(evolProcessing)}min` : '--'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        {/* Donut Chart */}
                                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col items-center">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Répartition des notes</h2>
                                            <p className="text-sm text-gray-500 mb-6">Distribution par nombre d'étoiles</p>
                                            <div className="w-64 h-64 mb-6">
                                                <Doughnut data={donutData} options={{ cutout: '70%' }} />
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                                <div className="text-gray-900 text-base font-semibold">5 étoiles <span className="font-bold">{percent(5)}%</span></div>
                                                <div className="text-gray-900 text-base font-semibold">4 étoiles <span className="font-bold">{percent(4)}%</span></div>
                                                <div className="text-gray-900 text-base font-semibold">3 étoiles <span className="font-bold">{percent(3)}%</span></div>
                                                <div className="text-gray-900 text-base font-semibold">2 étoiles <span className="font-bold">{percent(2)}%</span></div>
                                                <div className="text-gray-900 text-base font-semibold">1 étoile <span className="font-bold">{percent(1)}%</span></div>
                                            </div>
                                        </div>
                                        {/* Bar Chart */}
                                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sources des feedbacks</h2>
                                            <p className="text-sm text-gray-500 mb-6">Répartition par canal d'acquisition</p>
                                            <div className="w-full h-64">
                                                <Bar data={barData} options={{
                                                    indexAxis: 'y',
                                                    plugins: { legend: { display: false } },
                                                    scales: {
                                                        x: { grid: { display: false }, ticks: { color: '#0f172a' } },
                                                        y: { grid: { display: false }, ticks: { color: '#0f172a', font: { weight: 'bold' } } },
                                                    },
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Line Chart */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Évolution des notes</h2>
                                        <p className="text-sm text-gray-500 mb-6">Note moyenne et nombre de feedbacks sur les 30 derniers jours</p>
                                        <div className="w-full h-[600px]">
                                            <Line
                                                data={lineData}
                                                options={{
                                                    plugins: { legend: { display: false } },
                                                    elements: {
                                                        line: {
                                                            borderColor: '#1e3a8a',
                                                            backgroundColor: 'rgba(30,58,138,0.15)',
                                                            borderWidth: 4,
                                                        },
                                                        point: {
                                                            backgroundColor: '#1e3a8a',
                                                            borderColor: '#fff',
                                                            radius: 8,
                                                        },
                                                    },
                                                    spanGaps: true,
                                                    scales: {
                                                        x: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#1e3a8a', font: { size: 16 } } },
                                                        y: {
                                                            grid: { display: true, color: '#e5e7eb' },
                                                            ticks: { color: '#1e3a8a', font: { size: 18 } },
                                                            min: 1,
                                                            max: 5,
                                                            stepSize: 0.5,
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AuthenticatedLayout>
                    );
    }
