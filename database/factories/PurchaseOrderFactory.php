<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Outlet;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'outlet_id' => Outlet::factory(),
            'supplier_id' => Supplier::factory(),
            'po_number' => PurchaseOrder::generatePoNumber(),
            'status' => 'draft',
            'expected_date' => fake()->dateTimeBetween('+1 week', '+1 month'),
            'total' => fake()->randomFloat(2, 50000, 10000000),
            'catatan' => fake()->optional()->sentence(),
        ];
    }
}
