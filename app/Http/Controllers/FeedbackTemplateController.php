<?php

namespace App\Http\Controllers;

use App\Models\FeedbackTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeedbackTemplateController extends Controller
{
    /**
     * Récupérer tous les templates de l'entreprise
     */
    public function index()
    {
        $company = Auth::user()->company;

        $templates = FeedbackTemplate::where('company_id', $company->id)
            ->orderBy('channel')
            ->orderBy('is_default', 'desc')
            ->get();

        return response()->json($templates);
    }

    /**
     * Récupérer le template par défaut pour un canal
     */
    public function getDefault(Request $request)
    {
        $channel = $request->input('channel');
        $company = Auth::user()->company;

        $template = FeedbackTemplate::getDefaultForChannel($company->id, $channel);

        if (!$template) {
            // Créer un template par défaut si inexistant
            $template = $this->createDefaultTemplate($company->id, $channel);
        }

        return response()->json($template);
    }

    /**
     * Mettre à jour un template
     */
    public function update(Request $request, FeedbackTemplate $template)
    {
        $company = Auth::user()->company;

        // Vérifier que le template appartient à l'entreprise
        if ($template->company_id !== $company->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'nullable|string',
            'message' => 'required|string',
            'is_default' => 'sometimes|boolean',
        ]);

        // Si on met ce template en défaut, retirer le défaut des autres du même canal
        if (isset($data['is_default']) && $data['is_default']) {
            FeedbackTemplate::where('company_id', $company->id)
                ->where('channel', $template->channel)
                ->where('id', '!=', $template->id)
                ->update(['is_default' => false]);
        }

        $template->update($data);

        return response()->json($template);
    }

    /**
     * Créer un nouveau template
     */
    public function store(Request $request)
    {
        $company = Auth::user()->company;

        $data = $request->validate([
            'channel' => 'required|in:sms,email,qr',
            'name' => 'required|string|max:255',
            'subject' => 'nullable|string',
            'message' => 'required|string',
            'is_default' => 'sometimes|boolean',
        ]);

        $data['company_id'] = $company->id;

        // Si c'est le template par défaut, retirer les autres
        if (isset($data['is_default']) && $data['is_default']) {
            FeedbackTemplate::where('company_id', $company->id)
                ->where('channel', $data['channel'])
                ->update(['is_default' => false]);
        }

        $template = FeedbackTemplate::create($data);

        return response()->json($template);
    }

    /**
     * Supprimer un template
     */
    public function destroy(FeedbackTemplate $template)
    {
        $company = Auth::user()->company;

        if ($template->company_id !== $company->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Ne pas supprimer le dernier template par défaut
        if ($template->is_default) {
            $count = FeedbackTemplate::where('company_id', $company->id)
                ->where('channel', $template->channel)
                ->count();

            if ($count <= 1) {
                return response()->json(['error' => 'Cannot delete last template'], 400);
            }
        }

        $template->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Créer un template par défaut pour un canal
     */
    private function createDefaultTemplate(int $companyId, string $channel): FeedbackTemplate
    {
        $messages = [
            'sms' => "👋 Bonjour {Nom},\n\n⭐ Merci de nous avoir accordé votre confiance !\n\nVotre avis est très important pour {Nom de l'entreprise}. Cela nous aide à nous améliorer continuellement.\n\n💬 Veuillez partager votre expérience ici:\n{Votre lien}\n\n⏱️ Cela ne prend que 2 minutes.\n\nMerci beaucoup ! 🙏\n\nCordialement,\nL'équipe {Nom de l'entreprise}",
            'email' => "Bonjour {Nom},\n\n🎉 Merci de nous avoir accordé votre confiance !\n\nVotre satisfaction est notre priorité. C'est pourquoi nous aimerions connaître votre avis sur l'expérience que vous avez eue avec {Nom de l'entreprise}.\n\n💬 Votre retour nous aide à :\n✓ Améliorer nos services\n✓ Mieux répondre à vos besoins\n✓ Continuer à vous offrir la meilleure qualité\n\n👉 Veuillez partager votre expérience en cliquant sur le lien ci-dessous :\n{Votre lien}\n\n⏱️ Cela ne prend que 2-3 minutes\n\nMerci de votre temps ! 🙏\n\nCordialement,\nL'équipe {Nom de l'entreprise}\n\n---\nP.S. Votre confidentialité est importante pour nous. Vos réponses sont traitées de manière confidentielle.",
            'qr' => "📱 Scannez ce code QR pour partager votre avis sur {Nom de l'entreprise}\n\n⭐ Votre feedback est précieux pour nous !",
        ];

        $subjects = [
            'email' => "⭐ Votre avis nous intéresse - {Nom de l'entreprise}",
        ];

        $template = FeedbackTemplate::create([
            'company_id' => $companyId,
            'channel' => $channel,
            'name' => 'Template ' . strtoupper($channel) . ' par défaut',
            'subject' => $subjects[$channel] ?? null,
            'message' => $messages[$channel] ?? 'Template message',
            'is_default' => true,
        ]);

        return $template;
    }
}

