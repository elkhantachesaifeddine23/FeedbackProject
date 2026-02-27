<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackRequest;
use App\Jobs\GenerateAIReplyJob;
use App\Services\AIReplyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    /**
     * Liste de tous les feedbacks (admin)
     */
    public function index()
    {
        $company = Auth::user()->company;

        $feedbacks = FeedbackRequest::where('company_id', $company->id)
            ->with(['customer', 'feedback'])
            ->orderByRaw('COALESCE((SELECT is_pinned FROM feedback WHERE feedback.feedback_request_id = feedback_requests.id), false) DESC')
            ->latest()
            ->paginate(15)
            ->through(fn ($f) => [
                'id' => $f->id,
                'feedback_id' => $f->feedback?->id,
                'token' => $f->token,
                'customer' => [
                    'id' => $f->customer?->id,
                    'name' => $f->customer?->name ?? 'Client Google',
                    'email' => $f->customer?->email,
                ],
                'status' => $f->status,
                'channel' => $f->channel,
                'feedback' => [
                    'id' => $f->feedback?->id,
                    'rating' => $f->feedback?->rating,
                    'comment' => $f->feedback?->comment,
                    'is_pinned' => $f->feedback?->is_pinned ?? false,
                    'source' => $f->feedback?->source,
                    'google_review_id' => $f->feedback?->google_review_id,
                ],
                'created_at' => $f->created_at->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Feedbacks/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }

    /**
     * Page feedback public - formulaire de feedback global
     */
    public function showPublic()
    {
        // Récupérer la première company (ou adapter selon votre logique)
        // Pour un formulaire vraiment global, on peut laisser le client choisir sa company
        $companies = \App\Models\Company::all();

        if ($companies->isEmpty()) {
            return Inertia::render('Feedback/NotFound', [
                'message' => 'Aucune company disponible',
            ]);
        }

        // Valeurs par défaut
        $defaultSettings = [
            'primary_color' => '#3b82f6',
            'secondary_color' => '#1e40af',
            'star_style' => 'classic',
            'star_color' => '#fbbf24',
            'font_family' => 'Inter',
            'background_color' => '#f9fafb',
            'card_background' => '#ffffff',
            'text_color' => '#111827',
            'button_style' => 'rounded',
            'show_logo' => true,
            'custom_message' => 'Votre avis compte pour nous!',
        ];

        return Inertia::render('Feedback/CreatePublic', [
            'postUrl' => route('feedback.storePublic'),
            'companies' => $companies->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'logo_url' => $c->logo_url,
                'design_settings' => $c->design_settings ?? $defaultSettings,
            ]),
        ]);
    }

    /**
     * Soumission du feedback global
     */
    public function storePublic(Request $request)
    {
        $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'email' => ['required', 'email'],
            'name' => ['nullable', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ]);

        $company = \App\Models\Company::findOrFail($request->company_id);

        // Créer ou récupérer le customer
        $customer = \App\Models\Customer::firstOrCreate(
            [
                'company_id' => $company->id,
                'email' => $request->email,
            ],
            [
                'name' => $request->name,
                'phone' => null,
            ]
        );

        // Créer le feedback request
        $feedbackRequest = $customer->feedbackRequests()->create([
            'company_id' => $company->id,
            'token' => \Illuminate\Support\Str::uuid(),
            'channel' => 'qr',
            'status' => 'completed',
        ]);

        // Créer le feedback
        $feedback = Feedback::create([
            'feedback_request_id' => $feedbackRequest->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        // Récupérer les plateformes actives si rating > 3
        $activePlatforms = [];
        if ($request->rating > 3) {
            $activePlatforms = \App\Models\ReviewPlatform::where('company_id', $company->id)
                ->where('is_active', true)
                ->whereNotNull('platform_url')
                ->get()
                ->map(fn($p) => [
                    'name' => ucfirst($p->platform_name),
                    'url' => $p->platform_url,
                ])
                ->toArray();
        }

        return Inertia::render('Feedback/ThankYou', [
            'rating' => $request->rating,
            'activePlatforms' => $activePlatforms,
            'company' => [
                'name' => $company->name,
                'logo_url' => $company->logo_url,
            ],
        ]);
    }

    /**
     * Page feedback (client – via token)
     */
    public function show(string $token)
    {
        $feedbackRequest = FeedbackRequest::with('company', 'customer')
            ->where('token', $token)
            ->firstOrFail();

        if ($feedbackRequest->status === 'completed') {
            return Inertia::render('Feedback/AlreadySubmitted', [
                'company' => $feedbackRequest->company->name,
            ]);
        }

        // Valeurs par défaut si aucun design n'est configuré
        $defaultSettings = [
            'primary_color' => '#3b82f6',
            'secondary_color' => '#1e40af',
            'star_style' => 'classic',
            'star_color' => '#fbbf24',
            'font_family' => 'Inter',
            'background_color' => '#f9fafb',
            'card_background' => '#ffffff',
            'text_color' => '#111827',
            'button_style' => 'rounded',
            'show_logo' => true,
            'custom_message' => 'Votre avis compte pour nous!',
        ];

        return Inertia::render('Feedback/Create', [
            'token'   => $token,
            'postUrl' => route('feedback.store', $token),
            'company' => [
                'name' => $feedbackRequest->company->name,
                'logo_url' => $feedbackRequest->company->logo_url,
                'design_settings' => $feedbackRequest->company->design_settings ?? $defaultSettings,
            ],
            'customer'=> optional($feedbackRequest->customer)->name,
        ]);
    }

    /**
     * Soumission du feedback
     */
    public function store(Request $request, string $token)
    {
        $request->validate([
            'rating'  => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ]);

        $feedbackRequest = FeedbackRequest::with('company')
            ->where('token', $token)
            ->where('status', '!=', 'completed')
            ->firstOrFail();

        // ✅ Création du feedback
        $feedback = Feedback::create([
            'feedback_request_id' => $feedbackRequest->id,
            'rating'              => $request->rating,
            'comment'             => $request->comment,
            'is_public'           => true,
        ]);

        // 🌍 Détecte la langue du commentaire (si fourni)
        $aiService = new AIReplyService();
        $detectedLanguage = 'en'; // Défaut
        
        if ($request->comment) {
            $detectedLanguage = $aiService->detectLanguage($request->comment);
        }

        // ✅ Update request avec langue détectée et contenu du feedback
        $feedbackRequest->update([
            'status'              => 'completed',
            'responded_at'        => now(),
            'detected_language'   => $detectedLanguage,
            'feedback_text'       => $request->comment,
        ]);

        // 🤖 Lance le Job de génération de réponse IA (multilingue)
        dispatch(new GenerateAIReplyJob($feedback));

        // Récupérer les plateformes actives si rating > 3
        $activePlatforms = [];
        if ($feedback->rating > 3) {
            $activePlatforms = \App\Models\ReviewPlatform::where('company_id', $feedbackRequest->company_id)
                ->where('is_active', true)
                ->whereNotNull('platform_url')
                ->get()
                ->map(fn($p) => [
                    'name' => ucfirst($p->platform_name),
                    'url' => $p->platform_url,
                ])
                ->toArray();
        }

        return Inertia::render('Feedback/ThankYou', [
            'rating'    => $feedback->rating,
            'activePlatforms' => $activePlatforms,
            'company'   => $feedbackRequest->company->name,
        ]);
    }

    /**
     * Admin view
     */
    public function adminShow(int $id)
    {
        $feedbackRequest = FeedbackRequest::with('feedback', 'customer', 'company')
            ->findOrFail($id);

        return Inertia::render('Feedback/Show', [
            'token'    => $feedbackRequest->token,
            'feedback' => $feedbackRequest->feedback,
            'status'   => $feedbackRequest->status,
            'company'  => $feedbackRequest->company->name,
            'customer' => optional($feedbackRequest->customer)->name,
            'isAdmin'  => Auth::check(), 
        // ou Auth::user()?->is_admin si tu as un champ
        ]);
    }

    /**
     * Suppression d'un feedback (admin)
     */
    public function destroy($id)
    {
        $feedbackRequest = FeedbackRequest::findOrFail($id);
        $feedbackRequest->delete();
        // Supprimer aussi le feedback lié si besoin
        if ($feedbackRequest->feedback) {
            $feedbackRequest->feedback->delete();
        }
        return redirect()->route('feedbacks.index')->with('success', 'Feedback supprimé');
    }

    /**
     * Épingler/Désépingler un feedback (admin)
     */
    public function togglePin($id)
    {
        $feedback = Feedback::findOrFail($id);
        
        // Vérifier que l'utilisateur appartient à la même company
        $feedbackRequest = $feedback->feedbackRequest()->with('company')->first();
        
        if ($feedbackRequest->company_id !== Auth::user()->company_id) {
            abort(403, 'Unauthorized');
        }

        $feedback->is_pinned = !$feedback->is_pinned;
        $feedback->save();

        return back()->with('success', $feedback->is_pinned ? 'Feedback épinglé' : 'Feedback désépinglé');
    }
}
