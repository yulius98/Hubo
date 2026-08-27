<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Order;
use App\Models\OrderReturn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderReturn>
 */
class OrderReturnFactory extends Factory
{
    protected $model = OrderReturn::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'order_id' => Order::factory(),
            'return_number' => OrderReturn::generateReturnNumber(),
            'reason' => fake()->sentence(),
            'status' => 'pending',
            'refund_amount' => fake()->randomFloat(2, 10000, 1000000),
        ];
    }
}
