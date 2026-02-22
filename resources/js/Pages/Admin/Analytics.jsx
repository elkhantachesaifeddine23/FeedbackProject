
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

export default function AdminAnalytics({ stats, companiesTrend, feedbacksTrend, topCompanies, feedbacksByChannel }) {
        // Chart: feedbacks par canal (tous feedbacks, toutes entreprises)
        const channelLabels = ['SMS', 'QR Code', 'Email'];
        const channelData = {
            labels: channelLabels,
            datasets: [
                {
                    label: 'Feedbacks',
                    data: [feedbacksByChannel?.sms || 0, feedbacksByChannel?.qr || 0, feedbacksByChannel?.email || 0],
                    backgroundColor: '#0f172a',
                    borderRadius: 8,
                    barThickness: 32,
                },
            ],
        };
    // Données fictives pour l'exemple, à remplacer par les vraies props côté backend
    stats = stats || {
        totalCompanies: 42,
        newCompanies: 5,
        totalFeedbacks: 1200,
        avgFeedbacksPerCompany: 28,
        activeCompanies: 30,
    };
    companiesTrend = companiesTrend || [
        { date: '2026-01-01', count: 30 },
        { date: '2026-02-01', count: 35 },
        { date: '2026-03-01', count: 42 },
    ];
    feedbacksTrend = feedbacksTrend || [
        { date: '2026-01-01', count: 800 },
        { date: '2026-02-01', count: 1000 },
        { date: '2026-03-01', count: 1200 },
    ];
    topCompanies = topCompanies || [
        { name: 'Alpha SARL', feedbacks: 120, rating: 4.9 },
        { name: 'Beta Corp', feedbacks: 110, rating: 4.8 },
        { name: 'Gamma SAS', feedbacks: 95, rating: 4.7 },
    ];

    // Chart: évolution du nombre d'entreprises
    const companiesLineData = {
        labels: companiesTrend.map(t => t.date),
        datasets: [
            {
                label: "Entreprises inscrites",
                data: companiesTrend.map(t => t.count),
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30,58,138,0.15)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#1e3a8a',
                pointBorderColor: '#fff',
                pointRadius: 6,
            },
        ],
    };
    // Chart: évolution du nombre de feedbacks
    const feedbacksLineData = {
        labels: feedbacksTrend.map(t => t.date),
        datasets: [
            {
                label: "Feedbacks reçus",
                data: feedbacksTrend.map(t => t.count),
                borderColor: '#0f766e',
                backgroundColor: 'rgba(16,185,129,0.15)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0f766e',
                pointBorderColor: '#fff',
                pointRadius: 6,
            },
        ],
    };

    // Chart: top entreprises par feedbacks
    const topCompaniesBarData = {
        labels: topCompanies.map(c => c.name),
        datasets: [
            {
                label: 'Feedbacks',
                data: topCompanies.map(c => c.feedbacks),
                backgroundColor: '#1e3a8a',
                borderRadius: 8,
                barThickness: 32,
            },
        ],
    };

    return (
        <AdminLayout header="Analytique">
            <Head title="Admin - Analytique" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Statistiques globales */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Statistiques globales</h1>
                        <p className="text-sm text-gray-500 mb-6">Vue d'ensemble de l'activité des entreprises clientes</p>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                <div className="text-4xl font-bold text-indigo-700 mb-1">{stats.totalCompanies}</div>
                                <div className="text-sm text-gray-700 mb-2">Entreprises inscrites</div>
                                <div className="text-xs text-indigo-700 bg-indigo-100 rounded-full px-3 py-1 mt-2">+{stats.newCompanies} ce mois</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalFeedbacks}</div>
                                <div className="text-sm text-gray-700 mb-2">Feedbacks reçus</div>
                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{stats.avgFeedbacksPerCompany} / entreprise</div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow">
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeCompanies}</div>
                                <div className="text-sm text-gray-700 mb-2">Entreprises actives</div>
                                <div className="text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 mt-2">{Math.round((stats.activeCompanies / stats.totalCompanies) * 100)}% actives</div>
                            </div>
                        </div>
                    </div>
                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Line Chart: entreprises */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Évolution des entreprises</h2>
                            <p className="text-sm text-gray-500 mb-6">Nombre d'entreprises inscrites par mois</p>
                            <div className="w-full h-80">
                                <Line data={companiesLineData} options={{
                                    plugins: { legend: { display: false } },
                                    elements: {
                                        line: { borderColor: '#1e3a8a', backgroundColor: 'rgba(30,58,138,0.15)', borderWidth: 4 },
                                        point: { backgroundColor: '#1e3a8a', borderColor: '#fff', radius: 8 },
                                    },
                                    spanGaps: true,
                                    scales: {
                                        x: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#1e3a8a', font: { size: 16 } } },
                                        y: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#1e3a8a', font: { size: 18 } }, beginAtZero: true },
                                    },
                                }} />
                            </div>
                        </div>
                        {/* Line Chart: feedbacks */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Évolution des feedbacks</h2>
                            <p className="text-sm text-gray-500 mb-6">Nombre de feedbacks reçus par mois</p>
                            <div className="w-full h-80">
                                <Line data={feedbacksLineData} options={{
                                    plugins: { legend: { display: false } },
                                    elements: {
                                        line: { borderColor: '#0f766e', backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 4 },
                                        point: { backgroundColor: '#0f766e', borderColor: '#fff', radius: 8 },
                                    },
                                    spanGaps: true,
                                    scales: {
                                        x: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#0f766e', font: { size: 16 } } },
                                        y: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#0f766e', font: { size: 18 } }, beginAtZero: true },
                                    },
                                }} />
                            </div>
                        </div>
                    </div>
                    {/* Bar Chart: feedbacks par canal */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Feedbacks par canal</h2>
                        <p className="text-sm text-gray-500 mb-6">Total tous clients, par canal d'acquisition</p>
                        <div className="w-full h-80">
                            <Bar data={channelData} options={{
                                plugins: { legend: { display: false } },
                                indexAxis: 'y',
                                scales: {
                                    x: { grid: { display: false }, ticks: { color: '#0f172a', font: { weight: 'bold' } } },
                                    y: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 16 } } },
                                },
                            }} />
                        </div>
                    </div>
                    {/* Bar Chart: top entreprises */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Top entreprises par feedbacks</h2>
                        <p className="text-sm text-gray-500 mb-6">Classement des entreprises les plus actives</p>
                        <div className="w-full h-96">
                            <Bar data={topCompaniesBarData} options={{
                                plugins: { legend: { display: false } },
                                indexAxis: 'y',
                                scales: {
                                    x: { grid: { display: false }, ticks: { color: '#1e3a8a', font: { weight: 'bold' } } },
                                    y: { grid: { display: false }, ticks: { color: '#1e3a8a', font: { size: 16 } } },
                                },
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
