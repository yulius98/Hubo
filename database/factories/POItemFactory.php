<?php

namespace Database\Factories;

use App\Models\POItem;
use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<POItem>
 */
class POItemFactory extends Factory
{
    protected $model = POItem::class;

    public function definition(): array
    {
        $hargaBeli = fake()->randomFloat(2, 1000, 500000);
        $jumlah = fake()->numberBetween(1, 100);

        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'produk_id' => fake()->numberBetween(1, 50),
            'jumlah' => $jumlah,
            'harga_beli' => $hargaBeli,
            'subtotal' => $hargaBeli * $jumlah,
        ];
    }
}
