<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Customer;
use App\Models\LoyaltyTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyTransaction>
 */
class LoyaltyTransactionFactory extends Factory
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
            'customer_id' => Customer::factory(),
            'type' => LoyaltyTransaction::TYPE_EARN,
            'points' => 100,
            'description' => fake()->sentence(),
        ];
    }
}
