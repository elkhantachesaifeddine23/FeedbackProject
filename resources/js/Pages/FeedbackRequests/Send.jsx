import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Mail, MessageSquare, QrCode, Send, X } from 'lucide-react';
import axios from 'axios';

export default function SendFeedbackRequests({ auth, customers, companyName }) {
    const [selectedChannel, setSelectedChannel] = useState('sms');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [template, setTemplate] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('');

    // Charger le template par défaut quand le canal change
    useEffect(() => {
        loadDefaultTemplate();
    }, [selectedChannel]);

    // Mettre à jour la prévisualisation quand le message change
    useEffect(() => {
        updatePreview();
    }, [customMessage, selectedCustomers]);

    const loadDefaultTemplate = async () => {
        try {
            const response = await axios.get(route('feedback-templates.default'), {
                params: { channel: selectedChannel }
            });
            setTemplate(response.data);
            setCustomMessage(response.data.message);
            setCustomSubject(response.data.subject || '');
        } catch (error) {
            console.error('Erreur lors du chargement du template:', error);
        }
    };

    const updatePreview = () => {
        if (selectedCustomers.length === 0) {
            setPreviewMessage('');
            return;
        }

        // Prendre le premier client sélectionné pour la preview
        const firstCustomer = customers.find(c => selectedCustomers.includes(c.id));
        if (!firstCustomer) return;

        const variables = {
            'Nom': firstCustomer.name || 'Client',
            'Nom de l\'entreprise': companyName,
            'Votre lien': route('feedback.show', { token: 'preview-token' })
        };

        let preview = customMessage;
        Object.keys(variables).forEach(key => {
            preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), variables[key]);
        });

        setPreviewMessage(preview);
    };

    const toggleCustomerSelection = (customerId) => {
        setSelectedCustomers(prev =>
            prev.includes(customerId)
                ? prev.filter(id => id !== customerId)
                : [...prev, customerId]
        );
    };

    const handleSend = () => {
        if (selectedCustomers.length === 0) {
            alert('Veuillez sélectionner au moins un client');
            return;
        }

        if (!customMessage.trim()) {
            alert('Veuillez saisir un message');
            return;
        }

        setLoading(true);

        router.post(route('feedback-requests.sendWithTemplate'), {
            customer_ids: selectedCustomers,
            channel: selectedChannel,
            message: customMessage,
            subject: customSubject,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCustomers([]);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        });
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'sms':
                return <MessageSquare className="w-5 h-5" />;
            case 'email':
                return <Mail className="w-5 h-5" />;
            case 'qr':
                return <QrCode className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const channelLabels = {
        sms: 'SMS',
        email: 'E-mail',
        qr: 'QR Code'
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Demande d'avis">
            <Head title="Envoyer des demandes d'avis" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
                    <div className="relative p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-white mb-2">Demande d'avis par {channelLabels[selectedChannel]}</h1>
                                <p className="text-blue-100 text-lg">Invitez vos clients à partager leur expérience</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sélecteur de canal */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <div className="flex gap-4">
                        {['sms', 'email', 'qr'].map((channel) => (
                            <button
                                key={channel}
                                onClick={() => setSelectedChannel(channel)}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all ${
                                    selectedChannel === channel
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {getChannelIcon(channel)}
                                {channelLabels[channel]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sélection des clients */}
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Invitez vos clients</h2>
                        
                        <div className="mb-4">
                            <p className="text-sm font-bold text-gray-700 mb-2">
                                Limites mensuelles : <span className="text-blue-600">{selectedCustomers.length}/1000</span>
                            </p>
                        </div>

                        {/* Barre de recherche */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Bouton Tout sélectionner */}
                        {filteredCustomers.length > 0 && (
                            <div className="mb-4">
                                <button
                                    onClick={() => {
                                        if (selectedCustomers.length === filteredCustomers.length) {
                                            setSelectedCustomers([]);
                                        } else {
                                            setSelectedCustomers(filteredCustomers.map(c => c.id));
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl font-bold text-sm hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-blue-200"
                                >
                                    {selectedCustomers.length === filteredCustomers.length ? '✓ Tout désélectionner' : 'Tout sélectionner'}
                                </button>
                            </div>
                        )}

                        {/* Liste des clients */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                        selectedCustomers.includes(customer.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={(e) => {
                                        // Éviter le double déclenchement avec le checkbox
                                        if (e.target.type !== 'checkbox') {
                                            toggleCustomerSelection(customer.id);
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCustomers.includes(customer.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleCustomerSelection(customer.id);
                                        }}
                                        className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-2 border-gray-300"
                                    />
                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="font-bold text-gray-900">{customer.name || 'Sans nom'}</div>
                                        <div className="text-sm text-gray-600">
                                            {selectedChannel === 'email' ? customer.email : customer.phone}
                                        </div>
                                    </div>
                                    {selectedCustomers.includes(customer.id) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCustomerSelection(customer.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {filteredCustomers.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Aucun client trouvé</p>
                        )}
                    </div>

                    {/* Personnalisation du message */}
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Modifier le modèle</h2>

                        {/* Aperçu mobile */}
                        <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-gray-600" />
                                <span className="font-black text-gray-700">{companyName}</span>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-md">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {previewMessage || 'Sélectionnez un client pour voir l\'aperçu...'}
                                </p>
                            </div>
                        </div>

                        {/* Personnalisation de l'expéditeur */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Personnalisation de l'expéditeur
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 font-bold"
                            />
                            <p className="text-xs text-gray-500 mt-1">11/11</p>
                        </div>

                        {/* Sujet (pour email uniquement) */}
                        {selectedChannel === 'email' && (
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Sujet de l'email
                                </label>
                                <input
                                    type="text"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Votre avis nous intéresse"
                                />
                            </div>
                        )}

                        {/* Message */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Personnaliser le message
                            </label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm"
                                placeholder="Entrez votre message..."
                            />
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-2 text-xs">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">{'{Nom}'}</span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">{'{Votre lien}'}</span>
                                </div>
                                <p className="text-xs text-gray-500">3/5</p>
                            </div>
                        </div>

                        {/* Avertissement */}
                        <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                            <p className="text-sm text-yellow-800">
                                <span className="font-bold">⚠️</span> Tu es en train d'envoyer des messages <strong>3</strong>. Note que les emojis et certains caractères spéciaux peuvent augmenter la longueur totale du message.
                            </p>
                        </div>

                        {/* Bouton d'envoi */}
                        <button
                            onClick={handleSend}
                            disabled={loading || selectedCustomers.length === 0}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all ${
                                loading || selectedCustomers.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                            {loading ? 'Envoi en cours...' : `Demander un avis (${selectedCustomers.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
