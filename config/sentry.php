<?php

return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
    'profiles_sample_rate' => (float) env('SENTRY_PROFILES_SAMPLE_RATE', 0.1),
    'environment' => env('APP_ENV', 'production'),
    'before_send' => null,
];
