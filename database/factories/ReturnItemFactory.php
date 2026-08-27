<?php

namespace Database\Factories;

use App\Models\OrderReturn;
use App\Models\ReturnItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReturnItem>
 */
class ReturnItemFactory extends Factory
{
    protected $model = ReturnItem::class;

    public function definition(): array
    {
        return [
            'return_id' => OrderReturn::factory(),
            'order_item_id' => fake()->numberBetween(1, 50),
            'produk_id' => fake()->numberBetween(1, 50),
            'quantity' => fake()->numberBetween(1, 10),
            'reason' => fake()->sentence(),
        ];
    }
}
