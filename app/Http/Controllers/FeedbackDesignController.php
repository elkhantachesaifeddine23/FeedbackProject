<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FeedbackDesignController extends Controller
{
    /**
     * Affiche la page de configuration du design
     */
    public function edit()
    {
        $company = Auth::user()->company;

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

        return Inertia::render('FeedbackDesign/Edit', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'logo_url' => $company->logo_url,
                'design_settings' => $company->design_settings ?? $defaultSettings,
            ],
        ]);
    }

    /**
     * Met à jour la configuration du design
     */
    public function update(Request $request)
    {
        $company = Auth::user()->company;

        $request->validate([
            'logo' => ['nullable', 'image', 'max:2048'],
            'design_settings' => ['required', 'array'],
            'design_settings.primary_color' => ['required', 'string'],
            'design_settings.secondary_color' => ['required', 'string'],
            'design_settings.star_style' => ['required', 'in:classic,modern,heart,thumbs'],
            'design_settings.star_color' => ['required', 'string'],
            'design_settings.font_family' => ['required', 'string'],
            'design_settings.background_color' => ['required', 'string'],
            'design_settings.card_background' => ['required', 'string'],
            'design_settings.text_color' => ['required', 'string'],
            'design_settings.button_style' => ['required', 'in:rounded,square,pill'],
            'design_settings.show_logo' => ['required', 'boolean'],
            'design_settings.custom_message' => ['nullable', 'string', 'max:255'],
        ]);

        $logoUrl = $company->logo_url;

        // Upload du logo si présent
        if ($request->hasFile('logo')) {
            // Supprimer l'ancien logo
            if ($company->logo_url) {
                Storage::disk('public')->delete($company->logo_url);
            }

            $logoUrl = $request->file('logo')->store('logos', 'public');
        }

        $company->update([
            'logo_url' => $logoUrl,
            'design_settings' => $request->design_settings,
        ]);

        return redirect()->back()->with('success', 'Design mis à jour avec succès!');
    }
}

