import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User, Lock, Trash2, Save, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import GoogleBusinessProfileSection from '@/Components/GoogleBusinessProfileSection';

export default function Settings({ auth, user, company }) {
    const [activeTab, setActiveTab] = useState('profile');

    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const deleteForm = useForm({
        password: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.patch(route('settings.profile.update'), {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.patch(route('settings.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleDeleteAccount = (e) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            deleteForm.delete(route('settings.account.destroy'));
        }
    };

    const tabs = [
        { id: 'profile', name: 'Profil', icon: User },
        { id: 'security', name: 'Sécurité', icon: Shield },
        { id: 'integrations', name: 'Intégrations', icon: Shield },
        { id: 'account', name: 'Compte', icon: Trash2 },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Paramètres"
        >
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black mb-2">Paramètres du compte</h1>
                            <p className="text-blue-100">Gérez vos informations personnelles et préférences</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-blue-900 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-900" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Informations du profil</h2>
                                <p className="text-sm text-gray-500">Mettez à jour vos informations personnelles</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nom complet
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    required
                                />
                                {profileForm.errors.name && (
                                    <p className="mt-2 text-sm text-red-600">{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Adresse email
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    required
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-2 text-sm text-red-600">{profileForm.errors.email}</p>
                                )}
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-900 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-blue-900 mb-1">Compte créé le</p>
                                    <p className="text-gray-700">{user.created_at}</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {profileForm.processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-blue-900" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Sécurité</h2>
                                <p className="text-sm text-gray-500">Gérez votre mot de passe et la sécurité de votre compte</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mot de passe actuel
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    required
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-2 text-sm text-red-600">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    required
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-2 text-sm text-red-600">{passwordForm.errors.password}</p>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    Le mot de passe doit contenir au moins 8 caractères
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirmer le nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-semibold mb-1">Conseil de sécurité</p>
                                    <p>Utilisez un mot de passe unique et fort que vous n'utilisez nulle part ailleurs.</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
                                >
                                    <Lock className="w-5 h-5" />
                                    {passwordForm.processing ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div className="space-y-6">
                        <GoogleBusinessProfileSection company={company} auth={auth} />
                    </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Gestion du compte</h2>
                                <p className="text-sm text-gray-500">Gérez ou supprimez votre compte</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-bold text-red-900 mb-2">Zone dangereuse</h3>
                                    <p className="text-sm text-red-800 mb-4">
                                        La suppression de votre compte est permanente et irréversible. Toutes vos données seront perdues.
                                    </p>
                                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                                        <li>Tous vos clients seront supprimés</li>
                                        <li>Tous les feedbacks seront perdus</li>
                                        <li>Les paramètres de votre entreprise seront effacés</li>
                                        <li>Vous ne pourrez pas récupérer ces données</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleDeleteAccount} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirmez votre mot de passe pour supprimer le compte
                                </label>
                                <input
                                    type="password"
                                    value={deleteForm.data.password}
                                    onChange={(e) => deleteForm.setData('password', e.target.value)}
                                    placeholder="Entrez votre mot de passe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                                {deleteForm.errors.password && (
                                    <p className="mt-2 text-sm text-red-600">{deleteForm.errors.password}</p>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    {deleteForm.processing ? 'Suppression...' : 'Supprimer définitivement mon compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
