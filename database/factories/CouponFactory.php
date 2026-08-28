<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coupon>
 */
class CouponFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'code' => strtoupper(fake()->unique()->bothify('KPN-####')),
            'name' => fake()->words(2, true),
            'type' => 'percentage',
            'value' => 10,
            'min_purchase' => 0,
            'max_discount' => null,
            'valid_from' => now()->subDay(),
            'valid_to' => now()->addMonth(),
            'usage_limit' => null,
            'used_count' => 0,
            'is_active' => true,
        ];
    }

    public function fixed(float $value = 50000): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'fixed',
            'value' => $value,
        ]);
    }
}
