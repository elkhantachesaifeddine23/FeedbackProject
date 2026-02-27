
import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FeedbackCard from '@/Components/FeedbackCard';
import { QrCode, Download, Mail, MessageSquare } from 'lucide-react';

export default function Index({ auth, feedbacks }) {

    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedFeedbackForQR, setSelectedFeedbackForQR] = useState(null);
    const [globalQrModalOpen, setGlobalQrModalOpen] = useState(false);

    // Assume globalQRCode is available via window or props (adapt as needed)
    const globalQRCode = window.globalQRCode || null;

    const downloadGlobalQR = () => {
        if (!globalQRCode) return;
        const link = document.createElement('a');
        link.href = globalQRCode;
        link.download = 'qr-feedback-global.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtrage des feedbacks
    const filteredFeedbacks = feedbacks.data.filter(fb => {
        const matchesStatus = filterStatus === 'all' || fb.status === filterStatus;
        const matchesSearch = !searchTerm || 
            fb.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fb.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Stats calculées
    const stats = {
        total: feedbacks.data.length,
        sent: feedbacks.data.filter(fb => fb.status === 'sent').length,
        pending: feedbacks.data.filter(fb => fb.status === 'pending').length,
        completed: feedbacks.data.filter(fb => fb.status === 'completed').length,
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Feedbacks">
            <Head title="Feedbacks" />
            <div className="space-y-6">
                {/* Global QR Code Section (best practice: top of feedbacks page) */}
                {globalQRCode && (
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 mb-3 flex items-center gap-2">
                                    <QrCode className="w-8 h-8 text-blue-900" />
                                    QR Code Global
                                </h2>
                                <p className="text-gray-600 font-medium mb-4">
                                    Partagez ce QR code avec vos clients pour qu'ils puissent facilement laisser un feedback sans être lié à un client spécifique.
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Les feedbacks collectés seront créés comme nouveaux clients dans votre base de données.
                                </p>
                                <button
                                    onClick={() => setGlobalQrModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-all"
                                >
                                    <QrCode className="w-5 h-5" />
                                    Voir le QR Code
                                </button>
                            </div>
                            <div className="flex justify-center">
                                <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                                    <img 
                                        src={globalQRCode} 
                                        alt="QR Code Global"
                                        className="w-48 h-48"
                                    />
                                    <button
                                        onClick={downloadGlobalQR}
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Télécharger
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Header Premium */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700"></div>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-white mb-2">Tous les Feedbacks</h1>
                                <p className="text-blue-100 text-lg">Gérez toutes les demandes et réponses de feedback</p>
                            </div>
                            <Link
                                href={route('customers.index')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Envoyer une demande
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Premium */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total"
                        value={stats.total}
                        icon={<span className="text-2xl">📊</span>}
                        tone="slate"
                    />
                    <StatCard 
                        title="Envoyés"
                        value={stats.sent}
                        icon={<span className="text-2xl">📤</span>}
                        tone="blue"
                    />
                    <StatCard 
                        title="En attente"
                        value={stats.pending}
                        icon={<span className="text-2xl">⏳</span>}
                        tone="amber"
                    />
                    <StatCard 
                        title="Complétés"
                        value={stats.completed}
                        icon={<span className="text-2xl">✅</span>}
                        tone="emerald"
                    />
                </div>

                {/* Feedbacks Cards Modern */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                    {filteredFeedbacks.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchTerm || filterStatus !== 'all' ? 'Aucun feedback trouvé' : 'Aucun feedback pour le moment'}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || filterStatus !== 'all' 
                                    ? 'Essayez de modifier vos filtres' 
                                    : 'Les feedbacks apparaîtront ici une fois envoyés'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {filteredFeedbacks.map((fb) => (
                                <FeedbackCard
                                    key={fb.id}
                                    feedback={{
                                        ...fb,
                                        onQR: () => {
                                            setSelectedFeedbackForQR(fb);
                                            setQrModalOpen(true);
                                        },
                                        onDelete: () => {
                                            if (window.confirm('Voulez-vous vraiment supprimer ce feedback ?')) {
                                                router.delete(route('feedbacks.destroy', fb.id));
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Global QR Modal */}
                {globalQrModalOpen && globalQRCode && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setGlobalQrModalOpen(false)}
                    >
                        <div 
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-black text-gray-900 mb-6">
                                QR Code Global
                            </h3>
                            <div className="flex justify-center mb-6 bg-gray-50 p-6 rounded-xl">
                                <img 
                                    src={globalQRCode} 
                                    alt="QR Code Global"
                                    className="w-64 h-64"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadGlobalQR}
                                    className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Télécharger
                                </button>
                                <button
                                    onClick={() => setGlobalQrModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

/* ----------- COMPONENTS ----------- */

// Passer les fonctions de modal en props
function FeedbacksTable({ feedbacks, setQrModalOpen, setSelectedFeedbackForQR }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Canal</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Note</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Commentaire</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {feedbacks.map((fb) => (
                        <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{fb.customer?.name}</div>
                                <div className="text-xs text-gray-500">{fb.customer?.email || fb.customer?.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={fb.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <ChannelBadge channel={fb.channel} source={fb.feedback?.source} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {fb.feedback?.rating ? (
                                    <Rating value={fb.feedback.rating} />
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-700 max-w-xs truncate">
                                    {fb.feedback?.comment || <span className="text-gray-400">Aucun commentaire</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {fb.created_at}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <FeedbackActions 
                                    feedback={fb} 
                                    setQrModalOpen={setQrModalOpen}
                                    setSelectedFeedbackForQR={setSelectedFeedbackForQR}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StatCard({ title, value, icon, tone }) {
    const tones = {
        slate: {
            gradient: 'from-slate-500 via-slate-600 to-gray-600',
            border: 'border-slate-200'
        },
        blue: {
            gradient: 'from-blue-500 via-blue-600 to-cyan-600',
            border: 'border-blue-200'
        },
        amber: {
            gradient: 'from-amber-500 via-amber-600 to-orange-600',
            border: 'border-amber-200'
        },
        emerald: {
            gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
            border: 'border-emerald-200'
        }
    };

    return (
        <div className={`relative group bg-white rounded-2xl shadow-sm border-2 ${tones[tone].border} p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden`}>
            <div className="relative flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-1">{title}</p>
                    <p className="text-4xl font-black text-gray-900">{value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tones[tone].gradient} text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, gradient }) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active 
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg scale-105` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
        >
            {label}
        </button>
    );
}

function StatusBadge({ status }) {
    const statusConfig = {
        sent: {
            bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
            label: 'Envoyé',
            icon: '📤'
        },
        pending: {
            bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
            label: 'En attente',
            icon: '⏳'
        },
        completed: {
            bg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
            label: 'Complété',
            icon: '✅'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white ${config.bg} shadow-md`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}

function ChannelBadge({ channel, source }) {
    if (source === 'google') {
        return (
            <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200"
                title="Google Business Profile"
                aria-label="Google Business Profile"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-5.9s2.7-5.9 5.9-5.9c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"/>
                </svg>
            </span>
        );
    }

    const channelConfig = {
        email: {
            icon: Mail,
            label: 'Email',
            className: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        },
        sms: {
            icon: MessageSquare,
            label: 'SMS',
            className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        },
        whatsapp: {
            icon: MessageSquare,
            label: 'WhatsApp',
            className: 'text-green-600 bg-green-50 border-green-200',
        },
        qr: {
            icon: QrCode,
            label: 'QR',
            className: 'text-purple-600 bg-purple-50 border-purple-200',
        },
    };

    const config = channelConfig[channel];
    if (!config) {
        return <span className="text-xs text-gray-400">—</span>;
    }

    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${config.className}`}
            title={config.label}
            aria-label={config.label}
        >
            <Icon className="w-4 h-4" />
        </span>
    );
}

function Rating({ value }) {
    if (!value) {
        return <span className="text-sm text-gray-400 font-semibold">Pas encore noté</span>;
    }
    
    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                ))}
            </div>
            <span className="text-sm font-black text-gray-900">{value}/5</span>
        </div>
    );
}

function FeedbackActions({ feedback, setQrModalOpen, setSelectedFeedbackForQR }) {
    const handleQRClick = () => {
        setSelectedFeedbackForQR(feedback);
        setQrModalOpen(true);
    };

    if (feedback.status === 'completed' && feedback.feedback?.id) {
        return (
            <div className="flex items-center justify-end gap-2">
                <Link
                    href={route('feedback.adminShow', feedback.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all hover:scale-105"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Voir
                </Link>

                <Link
                    href={route('feedback.replies.index', feedback.feedback?.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all hover:scale-105"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Répondre
                </Link>

                <button
                    onClick={handleQRClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
                    title="Générer code QR"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR
                </button>
            </div>
        );
    }

    if (feedback.status !== 'completed') {
        return (
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500 font-bold">
                    En attente...
                </span>
                <button
                    onClick={handleQRClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
                    title="Générer code QR"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR
                </button>
            </div>
        );
    }

    return <span className="text-xs text-gray-400">—</span>;
}
