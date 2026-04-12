import React, { useState } from 'react';
import { Check, AlertCircle, RefreshCw, Unlink2, MapPin, Save, Search } from 'lucide-react';
import { router, useForm } from '@inertiajs/react';

export default function GoogleBusinessProfileSection({ company, auth }) {
    const [isLoading, setIsLoading] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    const mapsForm = useForm({
        google_maps_name: company?.google_maps_name || '',
    });

    const handleConnect = () => {
        setIsLoading(true);
        window.location.href = route('google.auth.connect');
    };

    const handleSyncReviews = () => {
        setIsLoading(true);
        setSyncResult(null);
        router.post(
            route('google.auth.sync'),
            {},
            {
                onFinish: () => setIsLoading(false),
                onSuccess: (page) => {
                    setSyncResult({ type: 'success', message: 'Avis synchronisés avec succès !' });
                },
                onError: () => {
                    setSyncResult({ type: 'error', message: 'Erreur lors de la synchronisation.' });
                },
            }
        );
    };

    const handleDisconnect = () => {
        if (!confirm('Êtes-vous sûr de vouloir déconnecter Google Business Profile ?')) {
            return;
        }
        setIsLoading(true);
        router.post(
            route('google.auth.disconnect'),
            {},
            {
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleSaveMapsName = (e) => {
        e.preventDefault();
        mapsForm.patch(route('settings.google-maps.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setSyncResult({ type: 'success', message: 'Nom Google Maps mis à jour ! Cliquez sur "Synchroniser" pour rechercher les avis.' });
            },
        });
    };

    const lastSyncDate = company?.google_last_sync_at
        ? new Date(company.google_last_sync_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : null;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        🏢 Google Business Profile
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Connectez votre profil Google pour importer automatiquement les avis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {company?.google_business_profile_connected && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Connecté</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Google Maps Business Name - Always visible */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-800">Nom du business sur Google Maps</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Entrez le nom exact de votre entreprise tel qu'il apparaît sur Google Maps (ex: "Meubles dolidol jamal kenitra").
                    Ce nom sera utilisé pour rechercher et synchroniser vos avis.
                </p>
                <form onSubmit={handleSaveMapsName} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={mapsForm.data.google_maps_name}
                        onChange={(e) => mapsForm.setData('google_maps_name', e.target.value)}
                        placeholder="Nom de votre business sur Google Maps..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={mapsForm.processing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                        <Save className="w-4 h-4" />
                        {mapsForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </form>
                {mapsForm.errors.google_maps_name && (
                    <p className="text-xs text-red-600 mt-1">{mapsForm.errors.google_maps_name}</p>
                )}
                {company?.google_place_id && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700">
                            Établissement trouvé (Place ID: {company.google_place_id.substring(0, 20)}...)
                        </span>
                    </div>
                )}
            </div>

            {/* Sync result feedback */}
            {syncResult && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                    syncResult.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {syncResult.message}
                </div>
            )}

            {company?.google_business_profile_connected ? (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Profil connecté</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Votre Google Business Profile est connecté. Synchronisez régulièrement pour importer les nouveaux avis.
                            </p>
                            {lastSyncDate && (
                                <p className="text-xs text-blue-600 mt-2">
                                    Dernière synchronisation : <strong>{lastSyncDate}</strong>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={handleSyncReviews}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Synchronisation...' : 'Synchroniser les avis'}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Unlink2 className="w-4 h-4" />
                            Déconnecter
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="mb-4">
                        <p className="text-gray-700 mb-2">
                            Connectez votre compte Google pour importer vos avis Google Maps.
                        </p>
                        <p className="text-xs text-gray-500">
                            💡 Astuce : renseignez d'abord le nom de votre business ci-dessus pour une meilleure détection.
                        </p>
                    </div>

                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {isLoading ? 'Connexion...' : 'Se connecter avec Google'}
                    </button>
                </div>
            )}
        </div>
    );
}
