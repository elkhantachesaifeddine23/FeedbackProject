import { useMemo, useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Mail, MessageSquare, QrCode, Send, PlusCircle, Upload, X, Users, UserPlus, Search } from 'lucide-react';
import axios from 'axios';

const emptyRecipient = { name: '', email: '', phone: '' };

export default function SendFeedbackRequests({ auth, companyName, customers = [] }) {
    const [selectedChannel, setSelectedChannel] = useState('sms');
    const [activeMode, setActiveMode] = useState('quick');
    const [quickRecipients, setQuickRecipients] = useState([{ ...emptyRecipient }, { ...emptyRecipient }]);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [consentConfirmed, setConsentConfirmed] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [previewMessage, setPreviewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDefaultTemplate();
    }, [selectedChannel]);

    useEffect(() => {
        updatePreview();
    }, [customMessage, selectedChannel, quickRecipients]);

    const loadDefaultTemplate = async () => {
        try {
            const response = await axios.get(route('feedback-templates.default'), {
                params: { channel: selectedChannel }
            });
            setCustomMessage(response.data.message || '');
            setCustomSubject(response.data.subject || '');
        } catch (error) {
            console.error('Erreur lors du chargement du template:', error);
        }
    };

    const normalizedRecipients = useMemo(() => {
        return quickRecipients
            .map((r) => ({
                name: (r.name || '').trim(),
                email: (r.email || '').trim(),
                phone: (r.phone || '').trim(),
            }))
            .filter((r) => {
                if (selectedChannel === 'email') return !!r.email;
                if (selectedChannel === 'sms') return !!r.phone;
                return !!r.name || !!r.email || !!r.phone;
            });
    }, [quickRecipients, selectedChannel]);

    const filteredCustomers = useMemo(() => {
        const q = customerSearch.toLowerCase();
        if (!q) return customers;
        return customers.filter((c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q)
        );
    }, [customers, customerSearch]);

    const toggleCustomer = (id) => {
        setSelectedCustomerIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAllCustomers = () => setSelectedCustomerIds(filteredCustomers.map((c) => c.id));
    const deselectAllCustomers = () => setSelectedCustomerIds([]);

    const MAX_RECIPIENTS = 50;
    const sendCount = activeMode === 'crm' ? selectedCustomerIds.length : normalizedRecipients.length;
    const exceededLimit = sendCount > MAX_RECIPIENTS;
    const isDisabled = loading || sendCount === 0 || selectedChannel === 'qr' || (activeMode === 'quick' && !consentConfirmed) || exceededLimit;

    const updatePreview = () => {
        const first = normalizedRecipients[0] || { name: 'Client' };

        const variables = {
            'Nom': first.name || 'Client',
            'Nom de l\'entreprise': companyName,
            'Votre lien': route('feedback.show', { token: 'preview-token' }),
        };

        let preview = customMessage || '';
        Object.keys(variables).forEach((key) => {
            preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), variables[key]);
        });

        setPreviewMessage(preview);
    };

    const updateRecipient = (index, key, value) => {
        setQuickRecipients((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [key]: value };
            return next;
        });
    };

    const removeRecipient = (index) => {
        setQuickRecipients((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const addRecipientRow = () => {
        setQuickRecipients((prev) => [...prev, { ...emptyRecipient }]);
    };

    const parseCsvFile = async (file) => {
        const text = await file.text();
        const rows = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (rows.length === 0) return;

        const parsed = rows.map((line) => {
            const cols = line.includes(';') ? line.split(';') : line.split(',');
            return {
                name: (cols[0] || '').trim(),
                phone: (cols[1] || '').trim(),
                email: (cols[2] || '').trim(),
            };
        });

        setQuickRecipients(parsed.length ? parsed : [{ ...emptyRecipient }]);
    };

    const onCsvChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await parseCsvFile(file);
        event.target.value = '';
    };

    const handleSend = () => {
        if (!customMessage.trim()) {
            alert('Veuillez saisir un message');
            return;
        }

        if (selectedChannel === 'qr') {
            alert('Le mode QR code nécessite un affichage physique.');
            return;
        }

        if (sendCount > MAX_RECIPIENTS) {
            alert(`Maximum ${MAX_RECIPIENTS} contacts par envoi. Vous en avez ${sendCount}.`);
            return;
        }

        if (activeMode === 'crm') {
            if (selectedCustomerIds.length === 0) {
                alert('Sélectionnez au moins un client.');
                return;
            }
        } else {
            if (normalizedRecipients.length === 0) {
                alert(selectedChannel === 'email' ? 'Ajoutez au moins un email.' : 'Ajoutez au moins un numéro.');
                return;
            }
            if (!consentConfirmed) {
                alert("Veuillez confirmer l'autorisation d'envoi.");
                return;
            }
        }

        setLoading(true);

        const payload = {
            channel: selectedChannel,
            message: customMessage,
            subject: customSubject,
        };

        if (activeMode === 'crm') {
            payload.customer_ids = selectedCustomerIds;
        } else {
            payload.recipients = normalizedRecipients;
            payload.consent_confirmed = consentConfirmed;
        }

        router.post(route('feedback-requests.sendWithTemplate'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setLoading(false);
                if (activeMode === 'crm') setSelectedCustomerIds([]);
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    const channelLabels = {
        sms: 'SMS',
        email: 'E-mail',
        qr: 'QR Code',
    };

    const channelIcons = {
        sms: <MessageSquare className="w-5 h-5" />,
        email: <Mail className="w-5 h-5" />,
        qr: <QrCode className="w-5 h-5" />,
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Demande d'avis">
            <Head title="Envoyer des demandes d'avis" />

            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-gray-900">Demande d'avis par {channelLabels[selectedChannel]}</h1>

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
                                {channelIcons[channel]}
                                {channelLabels[channel]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black text-gray-900">Invitez vos clients</h2>
                            <div className="text-right">
                                <p className={`text-lg font-black ${exceededLimit ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {sendCount}/{MAX_RECIPIENTS}
                                </p>
                                {exceededLimit && (
                                    <p className="text-xs text-red-600 font-bold mt-1">Dépassement de limite!</p>
                                )}
                            </div>
                        </div>

                        {exceededLimit && (
                            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                                <p className="text-sm text-red-700 font-bold">
                                    ⚠️ Maximum {MAX_RECIPIENTS} contacts par envoi. Vous en avez sélectionné {sendCount}.
                                </p>
                            </div>
                        )}

                        {/* Mode tabs */}
                        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveMode('quick')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                    activeMode === 'quick'
                                        ? 'bg-white text-blue-700 shadow'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UserPlus className="w-4 h-4" /> Contacts rapides
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMode('crm')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                    activeMode === 'crm'
                                        ? 'bg-white text-blue-700 shadow'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Users className="w-4 h-4" /> Clients enregistrés
                            </button>
                        </div>

                        {activeMode === 'quick' ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-sm font-bold text-gray-700">Avez-vous une liste de contacts ?</span>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-pointer hover:bg-slate-200 transition">
                                        <Upload className="w-4 h-4" />
                                        Charger un fichier CSV
                                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvChange} />
                                    </label>
                                </div>

                                <div className="space-y-3 mb-5">
                                    {quickRecipients.map((recipient, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Nom"
                                                value={recipient.name}
                                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                                className="col-span-5 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {selectedChannel === 'email' ? (
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={recipient.email}
                                                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                                    className="col-span-6 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Numéro"
                                                    value={recipient.phone}
                                                    onChange={(e) => updateRecipient(index, 'phone', e.target.value)}
                                                    className="col-span-6 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeRecipient(index)}
                                                className="col-span-1 flex justify-center text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-center gap-3 mb-4 text-sm font-semibold text-gray-800">
                                    <input
                                        type="checkbox"
                                        checked={consentConfirmed}
                                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    J'ai l'autorisation d'envoyer des messages à ce contact
                                </label>

                                <button
                                    type="button"
                                    onClick={addRecipientRow}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                                >
                                    <PlusCircle className="w-5 h-5" /> Ajouter une ligne
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Search bar */}
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un client..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Select all / deselect */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 font-semibold">
                                        {selectedCustomerIds.length} sélectionné(s) / {customers.length} clients
                                    </span>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={selectAllCustomers} className="text-xs text-blue-600 font-bold hover:underline">
                                            Tout sélectionner
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button type="button" onClick={deselectAllCustomers} className="text-xs text-gray-500 font-bold hover:underline">
                                            Désélectionner
                                        </button>
                                    </div>
                                </div>

                                {/* Customer list */}
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {filteredCustomers.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">Aucun client trouvé.</p>
                                    ) : (
                                        filteredCustomers.map((customer) => {
                                            const isSelected = selectedCustomerIds.includes(customer.id);
                                            return (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => toggleCustomer(customer.id)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                                                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-800 text-sm truncate">{customer.name || 'Sans nom'}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {selectedChannel === 'email' ? (customer.email || '—') : (customer.phone || '—')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Modifier le modèle</h2>

                        <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-gray-600" />
                                <span className="font-black text-gray-700">{companyName}</span>
                            </div>
                            <div className="bg-white rounded-2xl p-4 shadow-md">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {previewMessage || 'Ajoutez un contact pour voir l\'aperçu...'}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Personnalisation de l'expéditeur</label>
                            <input
                                type="text"
                                value={companyName}
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 font-bold"
                            />
                        </div>

                        {selectedChannel === 'email' && (
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Sujet de l'email</label>
                                <input
                                    type="text"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Personnaliser le message</label>
                            <textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm"
                            />
                            <div className="flex gap-2 text-xs mt-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">{'{Nom}'}</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">{'{Votre lien}'}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all ${
                                isDisabled
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                            {loading ? 'Envoi en cours...' : `Demander un avis (${sendCount})`}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
