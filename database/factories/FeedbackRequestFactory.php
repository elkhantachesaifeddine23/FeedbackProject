<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FeedbackRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'customer_id' => Customer::factory(),
            'token' => (string) \Illuminate\Support\Str::uuid(),
            'channel' => fake()->randomElement(['email', 'sms', 'qr']),
            'status' => 'sent',
            'sent_at' => now(),
        ];
    }
}
