<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Produk;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'produk_id' => Produk::factory(),
            'nama' => fake()->word(),
            'sku' => fake()->unique()->bothify('VAR-####'),
            'harga' => fake()->numberBetween(50000, 500000),
            'stok' => 10,
            'is_active' => true,
        ];
    }
}
