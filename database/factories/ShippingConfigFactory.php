<?php

namespace Database\Factories;

use App\Models\ShippingConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShippingConfig>
 */
class ShippingConfigFactory extends Factory
{
    protected $model = ShippingConfig::class;

    public function definition(): array
    {
        return [
            'api_key' => fake()->sha256(),
            'origin_city_id' => (string) fake()->numberBetween(1, 500),
            'origin_province' => fake()->city(),
        ];
    }
}
