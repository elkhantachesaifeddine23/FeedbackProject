import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminUsers() {
    return (
        <AdminLayout header="Utilisateurs">
            <Head title="Admin - Utilisateurs" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h3>
                        <p className="text-sm text-gray-600 mt-2">Admins, rôles, permissions, 2FA.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
