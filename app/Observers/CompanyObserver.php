<?php

namespace App\Observers;

use App\Models\Company;
use App\Models\FeedbackTemplate;
use Illuminate\Support\Facades\Log;

class CompanyObserver
{
    /**
     * Handle the Company "created" event.
     */
    public function created(Company $company): void
    {
        // Créer automatiquement les templates par défaut pour la nouvelle entreprise
        try {
            // Template SMS
            FeedbackTemplate::create([
                'company_id' => $company->id,
                'channel' => 'sms',
                'name' => 'Template SMS par défaut',
                'message' => "👋 Bonjour {Nom},\n\n⭐ Merci de nous avoir accordé votre confiance !\n\nVotre avis est très important pour {Nom de l'entreprise}. Cela nous aide à nous améliorer continuellement.\n\n💬 Veuillez partager votre expérience ici:\n{Votre lien}\n\n⏱️ Cela ne prend que 2 minutes.\n\nMerci beaucoup ! 🙏\n\nCordialement,\nL'équipe {Nom de l'entreprise}",
                'is_default' => true,
            ]);

            // Template Email
            FeedbackTemplate::create([
                'company_id' => $company->id,
                'channel' => 'email',
                'name' => 'Template Email par défaut',
                'subject' => '⭐ Votre avis nous intéresse - {Nom de l\'entreprise}',
                'message' => "Bonjour {Nom},\n\n🎉 Merci de nous avoir accordé votre confiance !\n\nVotre satisfaction est notre priorité. C'est pourquoi nous aimerions connaître votre avis sur l'expérience que vous avez eue avec {Nom de l'entreprise}.\n\n💬 Votre retour nous aide à :\n✓ Améliorer nos services\n✓ Mieux répondre à vos besoins\n✓ Continuer à vous offrir la meilleure qualité\n\n👉 Veuillez partager votre expérience en cliquant sur le lien ci-dessous :\n{Votre lien}\n\n⏱️ Cela ne prend que 2-3 minutes\n\nMerci de votre temps ! 🙏\n\nCordialement,\nL'équipe {Nom de l'entreprise}\n\n---\nP.S. Votre confidentialité est importante pour nous. Vos réponses sont traitées de manière confidentielle.",
                'is_default' => true,
            ]);

            // Template QR
            FeedbackTemplate::create([
                'company_id' => $company->id,
                'channel' => 'qr',
                'name' => 'Template QR par défaut',
                'message' => "📱 Scannez ce code QR pour partager votre avis sur {Nom de l'entreprise}\n\n⭐ Votre feedback est précieux pour nous !",
                'is_default' => true,
            ]);

            Log::info("Templates par défaut créés pour l'entreprise: {$company->name}");
        } catch (\Exception $e) {
            Log::error("Erreur lors de la création des templates pour l'entreprise {$company->id}: " . $e->getMessage());
        }
    }
}
