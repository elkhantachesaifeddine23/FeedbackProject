import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Mail, MessageSquare, QrCode, Trash2, Users, Eye, Download, Edit, Search, Calendar, Phone, AtSign, UserPlus, X } from 'lucide-react';

export default function Index({ auth, customers }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [bulkChannelMenuVisible, setBulkChannelMenuVisible] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedCustomerForQR, setSelectedCustomerForQR] = useState(null);
    const [qrImageData, setQrImageData] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState(null);

    const sendBulkFeedback = (channel) => {
        router.post(route('feedback-requests.bulk'), {
            customer_ids: selectedCustomers,
            channel,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCustomers([]);
                setBulkChannelMenuVisible(false);
            },
        });
    };

    const toggleCustomerSelection = (customerId) => {
        setSelectedCustomers(prev => 
            prev.includes(customerId) 
                ? prev.filter(id => id !== customerId)
                : [...prev, customerId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        }
    };

    const deleteCustomer = (id, name) => {
        if (!confirm(`Supprimer ${name} ?`)) return;
        router.delete(route('customers.destroy', id), { preserveScroll: true });
    };

    const handleQRClick = async (customer) => {
        setSelectedCustomerForQR(customer);
        setQrImageData(customer.qr_code_data || null);
        setQrModalOpen(true);
    };

    const downloadQR = (customer) => {
        if (!customer.qr_code_data) return;
        
        const link = document.createElement('a');
        link.href = customer.qr_code_data;
        link.download = `qr-customer-${customer.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDetailsClick = (customer) => {
        setSelectedCustomerForDetails(customer);
        setDetailsModalOpen(true);
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusConfig = {
        sent: { label: 'Envoyé', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
        delivered: { label: 'Délivré', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        failed: { label: 'Échoué', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
    };

    const getStatus = (status) => {
        const config = statusConfig[status] || { label: 'Aucun', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                {config.label}
            </span>
        );
    };

    const avatarColors = [
        'from-violet-500 to-purple-600',
        'from-sky-500 to-blue-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-cyan-500 to-teal-600',
        'from-fuchsia-500 to-purple-600',
        'from-lime-500 to-green-600',
    ];

    const getAvatarColor = (id) => avatarColors[id % avatarColors.length];

    return (
        <AuthenticatedLayout user={auth.user} header="Clients">
            <Head title="Clients" />

            <div className="space-y-6">
                {/* Header */}
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
                    <div className="absolute inset-0">
                        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
                                    <Users className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">Clients</h1>
                                    <p className="text-slate-400 text-sm mt-0.5">{customers.length} client{customers.length > 1 ? 's' : ''} au total</p>
                                </div>
                            </div>
                            <Link
                                href={route('customers.create')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                            >
                                <UserPlus className="w-4 h-4" />
                                Ajouter
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search & Filters Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {filteredCustomers.length > 0 && (
                                <button
                                    onClick={toggleSelectAll}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                                        selectedCustomers.length === filteredCustomers.length
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                    />
                                    Tout sélectionner
                                </button>
                            )}

                            {selectedCustomers.length > 0 && (
                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                        {selectedCustomers.length} sélectionné{selectedCustomers.length > 1 ? 's' : ''}
                                    </span>
                                    <button
                                        onClick={() => setBulkChannelMenuVisible(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        Envoyer feedbacks
                                    </button>
                                    <button
                                        onClick={() => setSelectedCustomers([])}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                        title="Désélectionner tout"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                {filteredCustomers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredCustomers.map(customer => {
                            const last = customer.feedback_requests?.[0];
                            const isSelected = selectedCustomers.includes(customer.id);

                            return (
                                <div
                                    key={customer.id}
                                    className={`group relative bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                                        isSelected 
                                            ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-sm' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {/* Selection checkbox */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleCustomerSelection(customer.id)}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-5">
                                        {/* Avatar + Name */}
                                        <div className="flex items-center gap-3.5 mb-4">
                                            <div className={`w-11 h-11 bg-gradient-to-br ${getAvatarColor(customer.id)} rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0`}>
                                                {customer.name?.charAt(0).toUpperCase() || customer.email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="min-w-0 flex-1 pr-6">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                    {customer.name || 'Sans nom'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {getStatus(last?.status)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="space-y-2 mb-4">
                                            {customer.email && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <AtSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{customer.email}</span>
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>
                                                    {last 
                                                        ? `Dernier envoi: ${new Date(last.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                        : 'Aucun envoi'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 -mx-5 mb-3"></div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDetailsClick(customer)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-all"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Détails
                                                </button>
                                                <Link
                                                    href={route('customers.edit', customer.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Modifier
                                                </Link>
                                                <button
                                                    onClick={() => handleQRClick(customer)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all"
                                                    title="QR Code"
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    QR
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => deleteCustomer(customer.id, customer.name || customer.email)}
                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {searchTerm ? 'Aucun résultat' : 'Aucun client'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {searchTerm 
                                ? `Aucun client ne correspond à "${searchTerm}"`
                                : 'Commencez par ajouter votre premier client'
                            }
                        </p>
                        {!searchTerm && (
                            <Link
                                href={route('customers.create')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                Ajouter un client
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Modal choix canal - envoi en masse */}
            {bulkChannelMenuVisible && selectedCustomers.length > 0 && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setBulkChannelMenuVisible(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Envoi en masse</h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {selectedCustomers.length} client{selectedCustomers.length > 1 ? 's' : ''} sélectionné{selectedCustomers.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <button onClick={() => setBulkChannelMenuVisible(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <ChannelButton icon={<Mail className="w-5 h-5" />} label="Par email" description="Envoyer par courrier électronique" onClick={() => sendBulkFeedback('email')} />
                            <ChannelButton icon={<MessageSquare className="w-5 h-5" />} label="Par SMS" description="Envoyer par message texte" onClick={() => sendBulkFeedback('sms')} />
                        </div>

                        <button
                            onClick={() => setBulkChannelMenuVisible(false)}
                            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Modal QR Code */}
            {qrModalOpen && selectedCustomerForQR && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setQrModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">QR Code</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedCustomerForQR.name || selectedCustomerForQR.email}</p>
                            </div>
                            <button onClick={() => setQrModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex justify-center mb-5">
                            {qrImageData ? (
                                <img 
                                    src={qrImageData} 
                                    alt="QR Code"
                                    className="w-56 h-56 border border-gray-200 rounded-xl"
                                />
                            ) : (
                                <div className="w-56 h-56 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mx-auto mb-3"></div>
                                        <p className="text-xs text-gray-500">Génération...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => downloadQR(selectedCustomerForQR)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                disabled={!qrImageData}
                            >
                                <Download className="w-4 h-4" />
                                Télécharger
                            </button>
                            <button
                                onClick={() => setQrModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Détails Client */}
            {detailsModalOpen && selectedCustomerForDetails && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setDetailsModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(selectedCustomerForDetails.id)} rounded-xl flex items-center justify-center text-white font-semibold text-sm`}>
                                    {selectedCustomerForDetails.name?.charAt(0).toUpperCase() || selectedCustomerForDetails.email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {selectedCustomerForDetails.name || 'Sans nom'}
                                    </h3>
                                    <p className="text-xs text-gray-500">ID #{selectedCustomerForDetails.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard label="Email" value={selectedCustomerForDetails.email || '—'} icon={<AtSign className="w-4 h-4" />} />
                                <InfoCard label="Téléphone" value={selectedCustomerForDetails.phone || '—'} icon={<Phone className="w-4 h-4" />} />
                                <InfoCard label="Créé le" value={new Date(selectedCustomerForDetails.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })} icon={<Calendar className="w-4 h-4" />} />
                                <InfoCard label="Mis à jour" value={new Date(selectedCustomerForDetails.updated_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })} icon={<Calendar className="w-4 h-4" />} />
                            </div>

                            {/* Feedback History */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                    Historique des demandes
                                </h4>
                                
                                {selectedCustomerForDetails.feedback_requests && selectedCustomerForDetails.feedback_requests.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedCustomerForDetails.feedback_requests.map((request, index) => (
                                            <div key={request.id || index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-gray-500 uppercase px-2 py-0.5 bg-white rounded border border-gray-200">
                                                        {request.channel || '—'}
                                                    </span>
                                                    <span className="text-sm text-gray-700">
                                                        {new Date(request.created_at).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {getStatus(request.status)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Aucune demande envoyée</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => setDetailsModalOpen(false)}
                                className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function InfoCard({ label, value, icon }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-gray-400">{icon}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        </div>
    );
}

function ChannelButton({ icon, label, description, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group text-left"
        >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-emerald-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                {icon}
            </div>
            <div>
                <span className="block text-sm font-semibold text-gray-900">{label}</span>
                {description && <span className="block text-xs text-gray-500">{description}</span>}
            </div>
        </button>
    );
}
