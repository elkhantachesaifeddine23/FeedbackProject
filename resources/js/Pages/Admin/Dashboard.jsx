import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminDashboard({ stats, ratingDistribution, replyStats, feedbackEvolution, topCompanies, sectorStats, recentFeedbacks, channelStats, companiesResponseRate }) {
    // Fonction pour obtenir la couleur selon la note
    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (rating >= 3) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    // Fonction pour obtenir l'icône selon la note
    const getRatingIcon = (rating) => {
        if (rating >= 4) return '⭐';
        if (rating >= 3) return '👍';
        return '👎';
    };

    // Calculer les statistiques pour le graphique
    const maxCount = feedbackEvolution && feedbackEvolution.length > 0 
        ? Math.max(...feedbackEvolution.map(e => e.count || 0), 1) 
        : 1;

    return (
        <AdminLayout header="Dashboard Administrateur">
            <Head title="Dashboard Admin" />

            <div className="py-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header avec badge */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
                                <p className="mt-2 text-sm text-gray-600">
                                    Vue d'ensemble complète de votre plateforme
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-lg">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-indigo-700">En direct</span>
                            </div>
                        </div>
                    </div>

                    {/* KPIs Cards - Design amélioré */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {/* Entreprises */}
                        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Entreprises</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clients */}
                        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Clients</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feedbacks */}
                        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Feedbacks</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Taux de réponse */}
                        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Taux de réponse</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.responseRate}%</p>
                                    </div>
                                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note moyenne et répartition - Design amélioré */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Note moyenne */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Note moyenne globale</h3>
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="relative">
                                    <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                        {stats.averageRating}
                                    </div>
                                    <div className="absolute -top-2 -right-2 text-4xl">⭐</div>
                                </div>
                                <p className="text-sm text-gray-500 mt-4">
                                    Basé sur {stats.totalFeedbacks} feedbacks
                                </p>
                            </div>
                        </div>

                        {/* Répartition des notes */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Répartition des notes</h3>
                            <div className="space-y-4">
                                {[5, 4, 3, 2, 1].map((rating) => {
                                    const count = ratingDistribution[rating] || 0;
                                    const percentage = stats.totalFeedbacks > 0 
                                        ? (count / stats.totalFeedbacks) * 100 
                                        : 0;
                                    
                                    return (
                                        <div key={rating} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getRatingIcon(rating)}</span>
                                                    <span className="font-medium text-gray-700">{rating} étoiles</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-600 font-medium">{count}</span>
                                                    <span className="text-gray-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        rating >= 4 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                                        rating >= 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                                        'bg-gradient-to-r from-red-400 to-red-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Graphique d'évolution - Design professionnel */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Évolution des feedbacks</h3>
                                <p className="text-sm text-gray-500 mt-1">30 derniers jours</p>
                            </div>
                        </div>
                        {feedbackEvolution && feedbackEvolution.length > 0 ? (
                            <div className="relative">
                                {/* Grille de fond */}
                                <div className="absolute inset-0 flex flex-col justify-between pb-12">
                                    {[0, 25, 50, 75, 100].map((percent) => (
                                        <div key={percent} className="border-t border-gray-100"></div>
                                    ))}
                                </div>
                                
                                {/* Graphique */}
                                <div className="relative h-64 flex items-end justify-between gap-1 px-2">
                                    {feedbackEvolution.map((item, index) => {
                                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                        const dateObj = new Date(item.date + 'T00:00:00');
                                        const dayLabel = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                        
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                                {/* Barre */}
                                                <div 
                                                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                                        item.count > 0 
                                                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 shadow-md hover:shadow-lg' 
                                                            : 'bg-gray-100'
                                                    }`}
                                                    style={{ 
                                                        height: `${Math.max(height, item.count > 0 ? 3 : 0)}%`,
                                                        minHeight: item.count > 0 ? '8px' : '2px'
                                                    }}
                                                    title={`${dayLabel}: ${item.count} feedback${item.count > 1 ? 's' : ''}`}
                                                >
                                                    {item.count > 0 && (
                                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                                    )}
                                                </div>
                                                
                                                {/* Tooltip */}
                                                {item.count > 0 && (
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                                                        <div className="font-semibold">{item.count} feedback{item.count > 1 ? 's' : ''}</div>
                                                        <div className="text-gray-300">{dayLabel}</div>
                                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                )}
                                                
                                                {/* Date (tous les 5 jours) */}
                                                {index % 5 === 0 && (
                                                    <span className="text-xs text-gray-500 mt-2 font-medium">
                                                        {dayLabel}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Légende */}
                                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-indigo-500"></div>
                                        <span className="text-xs text-gray-600">Feedbacks reçus</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-gray-200"></div>
                                        <span className="text-xs text-gray-600">Aucun feedback</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-500">Aucune donnée disponible pour les 30 derniers jours</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Réponses IA vs Admin et Top entreprises */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Réponses générées */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Réponses générées</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Par IA</p>
                                            <p className="text-sm text-gray-600">{replyStats.ai.count} réponses</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-purple-600">{replyStats.ai.percentage}%</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Par Admin</p>
                                            <p className="text-sm text-gray-600">{replyStats.admin.count} réponses</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">{replyStats.admin.percentage}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top entreprises */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top entreprises</h3>
                            <div className="space-y-3">
                                {topCompanies && topCompanies.length > 0 ? (
                                    topCompanies.slice(0, 5).map((company, index) => (
                                        <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                                    'bg-gradient-to-br from-gray-400 to-gray-500'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{company.name}</p>
                                                    <p className="text-xs text-gray-500">{company.sector || 'Non spécifié'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{company.feedbacks_count}</p>
                                                <p className="text-xs text-gray-500">feedbacks</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Aucune donnée disponible</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Feedbacks récents - Tableau amélioré */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Feedbacks récents</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entreprise</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Note</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Commentaire</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentFeedbacks && recentFeedbacks.length > 0 ? (
                                        recentFeedbacks.map((feedback) => (
                                            <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{feedback.company_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{feedback.customer_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {feedback.rating && (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRatingColor(feedback.rating)}`}>
                                                            {getRatingIcon(feedback.rating)} {feedback.rating}/5
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-md truncate">
                                                        {feedback.comment || <span className="text-gray-400 italic">Aucun commentaire</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{feedback.created_at}</div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center">
                                                <div className="text-sm text-gray-500">Aucun feedback disponible</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
