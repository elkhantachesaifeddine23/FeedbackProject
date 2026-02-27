import React, { useState } from 'react';
import { Check, AlertCircle, RefreshCw, Unlink2 } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function GoogleBusinessProfileSection({ company, auth }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = () => {
        setIsLoading(true);
        // Redirection vers Google OAuth
        window.location.href = route('google.auth.connect');
    };

    const handleSyncReviews = () => {
        setIsLoading(true);
        router.post(
            route('google.auth.sync'),
            {},
            {
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleDisconnect = () => {
        if (!confirm('Are you sure you want to disconnect Google Business Profile?')) {
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

    const lastSyncDate = company?.google_last_sync_at
        ? new Date(company.google_last_sync_at).toLocaleDateString()
        : null;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        🏢 Google Business Profile
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Connect your Google Business Profile to automatically import reviews
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {company?.google_business_profile_connected && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Connected</span>
                        </div>
                    )}
                </div>
            </div>

            {company?.google_business_profile_connected ? (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Profile Connected</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Your Google Business Profile is connected. Sync reviews regularly to keep them up to date.
                            </p>
                            {lastSyncDate && (
                                <p className="text-xs text-blue-600 mt-2">
                                    Last synced: <strong>{lastSyncDate}</strong>
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
                            <RefreshCw className="w-4 h-4" />
                            {isLoading ? 'Syncing...' : 'Sync Reviews'}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Unlink2 className="w-4 h-4" />
                            Disconnect
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="mb-4">
                        <p className="text-gray-700 mb-4">
                            Click the button below to connect your Google Business Profile and start importing reviews.
                        </p>
                    </div>

                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0z" />
                        </svg>
                        {isLoading ? 'Connecting...' : 'Connect with Google'}
                    </button>
                </div>
            )}
        </div>
    );
}
