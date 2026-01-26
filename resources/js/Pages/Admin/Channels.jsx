import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminChannels() {
    return (
        <AdminLayout header="Canaux">
            <Head title="Admin - Canaux" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Configuration des canaux</h3>
                        <p className="text-sm text-gray-600 mt-2">SMS, Email, paramètres d’envoi.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
