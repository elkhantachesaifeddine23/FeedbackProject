<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stripe keys
    |--------------------------------------------------------------------------
    */
    'stripe' => [
        'key'            => env('STRIPE_KEY'),            // pk_test_xxx
        'secret'         => env('STRIPE_SECRET'),         // sk_test_xxx
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'), // whsec_xxx
    ],

    /*
    |--------------------------------------------------------------------------
    | Plan definitions
    |--------------------------------------------------------------------------
    | stripe_price_id → create these products in Stripe dashboard first
    |   • Free: no Stripe price (no checkout needed)
    |   • Basic: recurring 59 €/month
    |   • Pro:   recurring 149 €/month
    |--------------------------------------------------------------------------
    */
    'plans' => [

        'free' => [
            'label'             => 'Free',
            'price_eur'         => 0,
            'stripe_price_id'   => null,
            'monthly_email_limit' => 10,        // lifetime total actually
            'monthly_sms_units' => 0,
            'features' => [
                'ai_replies'  => false,
                'ai_radar'    => false,
                'tasks'       => false,
                'sms'         => false,
            ],
        ],

        'basic' => [
            'label'             => 'Basic',
            'price_eur'         => 59,
            'stripe_price_id'   => env('STRIPE_PRICE_BASIC'),
            'monthly_email_limit' => null,      // unlimited
            'monthly_sms_units' => 200,
            'features' => [
                'ai_replies'  => true,
                'ai_radar'    => false,
                'tasks'       => false,
                'sms'         => true,
            ],
        ],

        'pro' => [
            'label'             => 'Pro',
            'price_eur'         => 149,
            'stripe_price_id'   => env('STRIPE_PRICE_PRO'),
            'monthly_email_limit' => null,      // unlimited
            'monthly_sms_units' => 500,
            'features' => [
                'ai_replies'  => true,
                'ai_radar'    => true,
                'tasks'       => true,
                'sms'         => true,
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Add-ons (one-time purchase, lifetime units)
    |--------------------------------------------------------------------------
    */
    'sms_addons' => [

        'sms_starter' => [
            'label'           => 'Pack SMS Starter',
            'units'           => 500,
            'price_eur'       => 29,
            'stripe_price_id' => env('STRIPE_PRICE_SMS_STARTER'),
        ],

        'sms_business' => [
            'label'           => 'Pack SMS Business',
            'units'           => 1500,
            'price_eur'       => 69,
            'stripe_price_id' => env('STRIPE_PRICE_SMS_BUSINESS'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | SMS unit cost by country prefix
    |--------------------------------------------------------------------------
    | Default = 1 unit.  Override per country calling-code prefix.
    */
    'sms_unit_costs' => [
        '+33'  => 1,      // France
        '+212' => 4.5,    // Morocco
        '+1'   => 1.5,    // US/Canada
        // add more as needed
    ],

    'sms_unit_cost_default' => 2,

];
