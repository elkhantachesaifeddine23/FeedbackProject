<?php

namespace Database\Factories;

use App\Models\FeedbackRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

class FeedbackFactory extends Factory
{
    public function definition(): array
    {
        return [
            'feedback_request_id' => FeedbackRequest::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->sentence(10),
            'is_public' => true,
            'is_pinned' => false,
        ];
    }

    public function negative(): static
    {
        return $this->state(fn () => [
            'rating' => fake()->numberBetween(1, 2),
            'comment' => fake()->sentence(15),
        ]);
    }

    public function positive(): static
    {
        return $this->state(fn () => [
            'rating' => fake()->numberBetween(4, 5),
            'comment' => fake()->sentence(10),
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn () => [
            'resolved_at' => now(),
            'resolution_note' => 'Résolu manuellement.',
        ]);
    }
}
