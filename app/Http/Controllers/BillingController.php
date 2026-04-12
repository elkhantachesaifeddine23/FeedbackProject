<?php

namespace App\Http\Controllers;

use App\Services\QuotaService;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function __construct(
        private StripeService $stripe,
        private QuotaService $quota,
    ) {}

    /**
     * Billing page — show plans, current subscription, usage, addons.
     */
    public function index()
    {
        $company = Auth::user()->company;

        return Inertia::render('Billing/Index', [
            'billing'   => $this->quota->getBillingSummary($company),
            'plans'     => $this->plansForFrontend(),
            'addons'    => $this->addonsForFrontend(),
            'stripeKey' => config('billing.stripe.key'),
        ]);
    }

    /**
     * Create Stripe Checkout for a subscription plan.
     */
    public function subscribe(Request $request)
    {
        $request->validate(['plan' => 'required|in:basic,pro']);

        $company = Auth::user()->company;
        $plan = $request->input('plan');

        $currentPlan = $company->currentPlan();
        if ($currentPlan === $plan) {
            return back()->with('info', 'Vous êtes déjà sur ce plan.');
        }

        try {
            $url = $this->stripe->createSubscriptionCheckout(
                company: $company,
                plan: $plan,
                successUrl: route('billing.index'),
                cancelUrl: route('billing.index'),
            );

            return Inertia::location($url);
        } catch (\Throwable $e) {
            return back()->withErrors(['stripe' => 'Erreur Stripe : ' . $e->getMessage()]);
        }
    }

    /**
     * Buy an SMS addon.
     */
    public function buyAddon(Request $request)
    {
        $request->validate(['addon' => 'required|in:sms_starter,sms_business']);

        $company = Auth::user()->company;

        // Must have at least basic plan to buy addons
        if (!$company->hasFeature('sms')) {
            return back()->withErrors(['addon' => 'Vous devez avoir un plan Basic ou Pro pour acheter des SMS.']);
        }

        try {
            $url = $this->stripe->createAddonCheckout(
                company: $company,
                addonSlug: $request->input('addon'),
                successUrl: route('billing.index'),
                cancelUrl: route('billing.index'),
            );

            return Inertia::location($url);
        } catch (\Throwable $e) {
            return back()->withErrors(['stripe' => 'Erreur Stripe : ' . $e->getMessage()]);
        }
    }

    /**
     * Open Stripe Customer Portal (manage subscription, invoices, payment methods).
     */
    public function portal()
    {
        $company = Auth::user()->company;

        try {
            $url = $this->stripe->createPortalSession(
                company: $company,
                returnUrl: route('billing.index'),
            );

            return Inertia::location($url);
        } catch (\Throwable $e) {
            return back()->withErrors(['stripe' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /* ── Private helpers ── */

    private function plansForFrontend(): array
    {
        $plans = [];
        foreach (config('billing.plans') as $slug => $cfg) {
            $plans[] = [
                'slug'       => $slug,
                'label'      => $cfg['label'],
                'price_eur'  => $cfg['price_eur'],
                'email_limit' => $cfg['monthly_email_limit'],
                'sms_units'  => $cfg['monthly_sms_units'],
                'features'   => $cfg['features'],
            ];
        }
        return $plans;
    }

    private function addonsForFrontend(): array
    {
        $addons = [];
        foreach (config('billing.sms_addons') as $slug => $cfg) {
            $addons[] = [
                'slug'      => $slug,
                'label'     => $cfg['label'],
                'units'     => $cfg['units'],
                'price_eur' => $cfg['price_eur'],
            ];
        }
        return $addons;
    }
}
