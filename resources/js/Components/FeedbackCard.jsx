import { Link, router } from '@inertiajs/react';
import { Pin, Mail, MessageSquare, QrCode } from 'lucide-react';

function getInitials(name, email) {
    if (!name && !email) return '?';
    if (name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    }
    return email[0].toUpperCase();
}

function RatingStars({ value = 0 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
                <svg key={i} className={`w-5 h-5 ${i <= value ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z"/></svg>
            ))}
        </div>
    );
}

function GoogleLogoIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-5.9s2.7-5.9 5.9-5.9c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"/>
        </svg>
    );
}

function ChannelIconBadge({ channel }) {
    const map = {
        email: { icon: Mail, label: 'Email', className: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
        sms: { icon: MessageSquare, label: 'SMS', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        whatsapp: { icon: MessageSquare, label: 'WhatsApp', className: 'text-green-600 bg-green-50 border-green-200' },
        qr: { icon: QrCode, label: 'QR', className: 'text-purple-600 bg-purple-50 border-purple-200' },
    };

    const config = map[channel];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-md border ${config.className}`}
            title={config.label}
            aria-label={config.label}
        >
            <Icon className="w-3.5 h-3.5" />
        </span>
    );
}

export default function FeedbackCard({ feedback, onReply }) {
    const initials = getInitials(feedback.customer?.name, feedback.customer?.email);
    const isPinned = feedback.feedback?.is_pinned || false;
    const isGoogleFeedback = feedback.feedback?.source === 'google';

    const handleTogglePin = () => {
        if (!feedback.feedback?.id) return;
        
        router.post(
            route('feedbacks.togglePin', feedback.feedback.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Optionnel: afficher une notification
                }
            }
        );
    };

    return (
        <div className={`bg-white rounded-3xl shadow-xl border-2 ${isPinned ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100'} p-6 mb-6 flex flex-col gap-3 transition-all hover:shadow-2xl hover:scale-[1.015] relative`}>
            {/* Badge épinglé */}
            {isPinned && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                    <span>Épinglé</span>
                </div>
            )}
            
            <div className="flex items-center gap-4 mb-1">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg border-4 border-white" style={{background: feedback.customer?.color || 'linear-gradient(135deg,#6366f1,#818cf8)'}}>
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg text-gray-900 truncate">{feedback.customer?.name || 'Client supprimé'}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                        <span>{new Date(feedback.created_at).toLocaleDateString('fr-FR', {year: 'numeric', month: 'short', day: 'numeric'})}</span>
                        {isGoogleFeedback ? (
                            <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white border border-gray-200"
                                title="Google Business Profile"
                                aria-label="Google Business Profile"
                            >
                                <GoogleLogoIcon />
                            </span>
                        ) : (
                            <ChannelIconBadge channel={feedback.channel} />
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0"><RatingStars value={feedback.feedback?.rating} /></div>
            </div>
            <div className="text-gray-700 text-base mb-2 px-1 leading-relaxed">
                {feedback.feedback?.comment ? (
                    <span className="block">{feedback.feedback.comment}</span>
                ) : (
                    <span className="italic text-gray-400">Aucun commentaire</span>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 pt-2 border-t border-gray-100">
                <Link href={route('feedback.adminShow', feedback.id)} className="px-4 py-2 bg-gray-50 text-blue-700 rounded-full font-bold shadow hover:bg-blue-50 transition text-xs">Voir</Link>
                {feedback.feedback?.id && (
                    <>
                        <Link href={route('feedback.replies.index', feedback.feedback.id)} className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition text-xs">Répondre</Link>
                        <button 
                            onClick={handleTogglePin}
                            className={`px-4 py-2 rounded-full font-bold shadow transition text-xs flex items-center gap-1.5 ${
                                isPinned 
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={isPinned ? 'Désépingler' : 'Épingler'}
                        >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                            {isPinned ? 'Désépingler' : 'Épingler'}
                        </button>
                    </>
                )}
                <button onClick={() => feedback.onDelete(feedback)} className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold shadow hover:bg-red-200 transition text-xs">Supprimer</button>
            </div>
        </div>
    );
}
