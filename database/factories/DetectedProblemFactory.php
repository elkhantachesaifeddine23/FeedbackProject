<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\DetectedProblem;
use Illuminate\Database\Eloquent\Factories\Factory;

class DetectedProblemFactory extends Factory
{
    protected $model = DetectedProblem::class;

    public function definition(): array
    {
        $title = fake()->sentence(4);
        $companyId = Company::factory();

        return [
            'company_id' => $companyId,
            'title' => $title,
            'detail' => fake()->paragraph(),
            'solution' => fake()->paragraph(),
            'effort' => fake()->randomElement(['faible', 'moyen', 'élevé']),
            'impact' => fake()->randomElement(['faible', 'moyen', 'fort']),
            'urgency' => fake()->randomElement(['immédiat', 'court_terme', 'moyen_terme']),
            'status' => DetectedProblem::STATUS_OPEN,
            'type' => DetectedProblem::TYPE_PROBLEM,
            'ai_hash' => fn (array $attrs) => DetectedProblem::generateHash(
                $attrs['title'],
                is_int($attrs['company_id']) ? $attrs['company_id'] : 0
            ),
            'feedbacks_count' => 0,
        ];
    }

    public function problem(): static
    {
        return $this->state(fn () => ['type' => DetectedProblem::TYPE_PROBLEM]);
    }

    public function decision(): static
    {
        return $this->state(fn () => ['type' => DetectedProblem::TYPE_DECISION, 'solution' => null, 'effort' => null]);
    }

    public function resolved(): static
    {
        return $this->state(fn () => [
            'status' => DetectedProblem::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['status' => DetectedProblem::STATUS_IN_PROGRESS]);
    }
}
