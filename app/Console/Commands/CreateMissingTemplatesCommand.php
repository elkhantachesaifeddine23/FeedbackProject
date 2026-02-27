<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\FeedbackTemplate;
use Illuminate\Console\Command;

class CreateMissingTemplatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:create-missing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Créer les templates manquants pour les companies existantes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::all();
        $created = 0;

        foreach ($companies as $company) {
            // Vérifier si la company a déjà des templates
            $existingTemplatesCount = FeedbackTemplate::where('company_id', $company->id)->count();
            
            if ($existingTemplatesCount === 0) {
                $this->info("Création des templates pour: {$company->name}");
                
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

                $created++;
            } else {
                $this->line("Templates déjà existants pour: {$company->name} ({$existingTemplatesCount} templates)");
            }
        }

        $this->info("✅ Terminé! {$created} entreprise(s) ont reçu leurs templates.");
        return 0;
    }
}
