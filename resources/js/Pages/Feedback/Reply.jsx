import { useState } from 'react';
import { useForm, Head, Link, usePage } from '@inertiajs/react';

export default function Reply({ feedback, replyContext = {} }) {
    const { props } = usePage();
    const { data, setData, post, processing } = useForm({
        content: '',
    });

    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const isGoogle = replyContext.is_google || false;
    const googleConnected = replyContext.google_connected || false;
    const hasGoogleReply = replyContext.has_google_reply || false;
    const source = replyContext.source || 'manual';

    const submitManual = (e) => {
        e.preventDefault();
        post(route('feedback.replies.store', feedback.id), {
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        });
    };

    const submitAI = async () => {
        setAiError(null);
        setAiLoading(true);
        
        try {
            // Utiliser Inertia pour faire la requête avec le bon CSRF token
            const response = await window.axios.post(
                route('feedback.replies.ai.generate', feedback.id)
            );

            if (response.data?.content) {
                setData('content', response.data.content);
            } else {
                throw new Error('Réponse IA invalide');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Erreur lors de la génération IA';
            setAiError(message);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <>
            <Head title="Répondre au feedback" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 ${
                            isGoogle ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                        }`}>
                            {isGoogle ? (
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Répondre au feedback
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Client : {feedback.feedback_request?.customer?.name || 'Sans nom'}
                        </p>

                        {/* Source Badge */}
                        <div className="mt-3 flex justify-center">
                            {isGoogle ? (
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Avis Google Business Profile
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Feedback Plateforme ({feedback.feedback_request?.channel || 'email'})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Feedback Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {feedback.feedback_request?.customer?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    Feedback du client
                                </h3>
                                
                                {/* Rating */}
                                {feedback.rating && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={`w-5 h-5 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{feedback.rating}/5</span>
                                    </div>
                                )}

                                {/* Comment */}
                                {feedback.comment && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            "{feedback.comment}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Response Form */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* Google Context Alerts */}
                        {isGoogle && (
                            <div className={`px-6 py-3 text-sm ${
                                hasGoogleReply
                                    ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-800'
                                    : !googleConnected
                                        ? 'bg-amber-50 border-b border-amber-200 text-amber-800'
                                        : 'bg-blue-50 border-b border-blue-200 text-blue-800'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {hasGoogleReply ? (
                                        <>
                                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Une réponse a déjà été publiée sur Google pour cet avis.</span>
                                        </>
                                    ) : !googleConnected ? (
                                        <>
                                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Compte Google non connecté — la réponse sera sauvegardée mais ne sera pas publiée sur Google.</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Cette réponse sera publiée directement sur Google Business Profile.</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Form Header */}
                        <div className={`px-8 py-6 ${
                            isGoogle
                                ? 'bg-gradient-to-r from-red-600 to-orange-500'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        }`}>
                            <h2 className="text-lg font-semibold text-white">
                                {isGoogle ? 'Votre réponse Google' : 'Votre réponse'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {isGoogle
                                    ? 'Cette réponse sera visible publiquement sur votre fiche Google'
                                    : 'Rédigez une réponse personnalisée ou utilisez l\'IA pour vous aider'
                                }
                            </p>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <div className="space-y-6">
                                {/* Textarea */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        Contenu de la réponse *
                                    </label>
                                    <textarea
                                        className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                        rows="8"
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        placeholder="Écrivez votre réponse ici...&#10;&#10;Exemple : &#10;Merci beaucoup pour votre retour ! Nous sommes ravis que notre service vous ait plu. N'hésitez pas à nous contacter si vous avez besoin d'aide."
                                        disabled={processing || aiLoading}
                                    />
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            {data.content.length} caractères
                                        </p>
                                        {data.content && (
                                            <button
                                                type="button"
                                                onClick={() => setData('content', '')}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Effacer
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* AI Error */}
                                {aiError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-800">Erreur IA</p>
                                            <p className="text-sm text-red-700 mt-0.5">{aiError}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Info Box */}
                                <div className={`border rounded-xl p-4 ${
                                    isGoogle ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isGoogle ? 'text-red-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-semibold ${isGoogle ? 'text-red-900' : 'text-blue-900'}`}>
                                                {isGoogle ? 'Réponse Google — Important' : 'Conseil'}
                                            </h4>
                                            <p className={`text-sm mt-1 ${isGoogle ? 'text-red-700' : 'text-blue-700'}`}>
                                                {isGoogle
                                                    ? 'Cette réponse sera visible publiquement sur Google. Soyez professionnel, ne partagez pas de données privées, et gardez un ton constructif.'
                                                    : 'Une bonne réponse remercie le client, montre de l\'empathie et propose une solution si nécessaire.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={submitManual}
                                        disabled={processing || aiLoading || !data.content || (isGoogle && !googleConnected && false)}
                                        className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                                            isGoogle
                                                ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {isGoogle ? 'Publication sur Google...' : 'Envoi en cours...'}
                                            </>
                                        ) : (
                                            <>
                                                {isGoogle ? (
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                )}
                                                {isGoogle ? 'Publier sur Google' : 'Envoyer la réponse'}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submitAI}
                                        disabled={processing || aiLoading}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {aiLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Génération IA...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Générer avec IA
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Cancel Link */}
                                <div className="text-center pt-2">
                                    <Link 
                                        href={route('feedbacks.index')} 
                                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Annuler et retourner
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {isGoogle ? 'Bonnes pratiques Google' : 'Comment bien répondre ?'}
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {isGoogle ? (
                                <>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>La réponse sera <strong>visible publiquement</strong> sur votre fiche Google</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Ne partagez <strong>jamais de données personnelles</strong> (téléphone, adresse, etc.)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Gardez un ton <strong>professionnel et constructif</strong>, même pour les avis négatifs</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span>L'IA peut vous aider à rédiger, mais <strong>relisez toujours avant publication</strong></span>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Remerciez le client pour son feedback, qu'il soit positif ou négatif</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Montrez de l'empathie et personnalisez votre réponse</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Si nécessaire, proposez une action concrète ou une solution</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span>Utilisez l'IA pour vous inspirer, mais personnalisez toujours</span>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
                    <div className={`text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
                        isGoogle ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold">{isGoogle ? 'Publié sur Google !' : 'Réponse envoyée !'}</p>
                            <p className="text-sm opacity-80">{isGoogle ? 'Votre réponse est visible sur Google' : 'Le client a été notifié'}</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
}