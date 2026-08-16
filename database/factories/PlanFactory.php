<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'slug' => fake()->unique()->slug(2),
            'description' => null,
            'price_monthly' => 0,
            'max_outlets' => 1,
            'max_products' => 50,
            'max_staff' => 3,
            'trial_days' => 14,
            'is_active' => true,
        ];
    }

    /**
     * Remove all resource limits from the plan.
     */
    public function unlimited(): static
    {
        return $this->state(fn (array $attributes) => [
            'max_outlets' => null,
            'max_products' => null,
            'max_staff' => null,
        ]);
    }
}
