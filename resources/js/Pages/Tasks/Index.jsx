import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProGate from '@/Components/ProGate';
import { ListTodo, Zap, Clock, CheckCircle2, Plus, Loader2 } from 'lucide-react';

export default function TasksIndex({ auth, hasAccess = true, tasks, statusOptions, importanceOptions }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        importance: 'medium',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleStatusChange = (taskId, status) => {
        router.patch(route('tasks.updateStatus', taskId), { status }, { preserveScroll: true });
    };

    // Calculate stats
    const stats = {
        total: tasks.length,
        notStarted: tasks.filter(t => t.status === 'not_started').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Tâches">
            <Head title="Tâches" />

            <ProGate feature="tasks" hasAccess={hasAccess}>
            <div className="space-y-8">
                {/* Premium Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 rounded-3xl shadow-2xl">
                    {/* Blur Blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />
                    
                    <div className="relative px-8 py-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                                    <ListTodo className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                                        Gestion des Tâches
                                    </h1>
                                    <p className="text-purple-100 text-base font-medium">
                                        ⚡ Créez et suivez vos actions issues de l'analyse Radar IA
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        icon="📋"
                        label="Total"
                        value={stats.total}
                        gradient="from-purple-500 to-fuchsia-500"
                    />
                    <StatCard
                        icon="⏸️"
                        label="À faire"
                        value={stats.notStarted}
                        gradient="from-gray-500 to-slate-500"
                    />
                    <StatCard
                        icon="⚡"
                        label="En cours"
                        value={stats.inProgress}
                        gradient="from-amber-500 to-orange-500"
                    />
                    <StatCard
                        icon="✅"
                        label="Terminé"
                        value={stats.completed}
                        gradient="from-emerald-500 to-teal-500"
                    />
                </div>

                {/* Create Task Card */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-200">
                    <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 px-8 py-6 border-b-2 border-purple-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Créer une nouvelle tâche</h3>
                                <p className="text-sm text-gray-600">Ajoutez une action à suivre pour améliorer votre service</p>
                            </div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Titre de la tâche
                                </label>
                                <input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200"
                                    placeholder="Ex: Améliorer le temps de réponse aux clients"
                                />
                                {errors.title && (
                                    <p className="mt-2 text-sm text-rose-600 font-medium flex items-center gap-1">
                                        <span>⚠️</span> {errors.title}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Priorité
                                </label>
                                <select
                                    value={data.importance}
                                    onChange={(e) => setData('importance', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200"
                                >
                                    {importanceOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Description détaillée
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200"
                                rows={4}
                                placeholder="Détaillez le problème à résoudre et les actions à entreprendre..."
                            />
                            {errors.description && (
                                <p className="mt-2 text-sm text-rose-600 font-medium flex items-center gap-1">
                                    <span>⚠️</span> {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t-2 border-gray-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-base font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                        Créer la tâche
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tasks List */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 px-8 py-6 border-b-2 border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <ListTodo className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Toutes les tâches</h3>
                                    <p className="text-sm text-gray-600">{tasks.length} tâche{tasks.length > 1 ? 's' : ''} au total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {tasks.length ? (
                        <div className="divide-y-2 divide-gray-100">
                            {tasks.map((task) => (
                                <div 
                                    key={task.id} 
                                    className="px-8 py-6 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-fuchsia-50/50 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="mt-1">
                                                    <ImportanceBadge importance={task.importance} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                                                        {task.title}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 ml-16">
                                                <Clock className="w-3 h-3" />
                                                Créé le {task.created_at}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:ml-6">
                                            <StatusBadge status={task.status} />
                                            <select
                                                value={task.status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className="min-w-[160px] px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 hover:border-purple-300"
                                            >
                                                {statusOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-8 py-16 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-2xl mb-4">
                                <ListTodo className="w-10 h-10 text-purple-600" />
                            </div>
                            <p className="text-base text-gray-500 font-medium">
                                Aucune tâche pour le moment
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Créez votre première tâche ci-dessus pour commencer
                            </p>
                        </div>
                    )}
                </div>
            </div>
            </ProGate>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon, label, value, gradient }) {
    return (
        <div className="group bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{icon}</span>
                <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl font-black text-white">{value}</span>
                </div>
            </div>
            <p className="text-sm font-bold text-gray-600">{label}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const config = {
        not_started: {
            bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
            text: 'text-gray-700',
            border: 'border-gray-300',
            emoji: '⏸️',
            label: 'À faire',
        },
        in_progress: {
            bg: 'bg-gradient-to-r from-amber-100 to-orange-100',
            text: 'text-amber-700',
            border: 'border-amber-300',
            emoji: '⚡',
            label: 'En cours',
        },
        completed: {
            bg: 'bg-gradient-to-r from-emerald-100 to-teal-100',
            text: 'text-emerald-700',
            border: 'border-emerald-300',
            emoji: '✅',
            label: 'Terminé',
        },
    };

    const { bg, text, border, emoji, label } = config[status] || config.not_started;

    return (
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${border} ${bg} ${text} text-sm font-bold shadow-sm`}>
            <span>{emoji}</span>
            {label}
        </span>
    );
}

function ImportanceBadge({ importance }) {
    const config = {
        high: {
            bg: 'bg-gradient-to-r from-rose-100 to-red-100',
            text: 'text-rose-700',
            border: 'border-rose-300',
            emoji: '🔴',
            label: 'Urgent',
        },
        medium: {
            bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
            text: 'text-amber-700',
            border: 'border-amber-300',
            emoji: '🟡',
            label: 'Moyen',
        },
        low: {
            bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
            text: 'text-emerald-700',
            border: 'border-emerald-300',
            emoji: '🟢',
            label: 'Faible',
        },
    };

    const { bg, text, border, emoji, label } = config[importance] || config.medium;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${border} ${bg} ${text} text-xs font-bold shadow-sm`}>
            <span>{emoji}</span>
            {label}
        </span>
    );
}
