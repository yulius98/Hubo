<?php

namespace Database\Factories;

use App\Models\Outlet;
use App\Models\Produk;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Produk>
 */
class ProdukFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_outlet' => Outlet::factory(),
            'nama_produk' => fake()->unique()->words(3, true),
            'harga_beli' => 50000,
            'harga' => 100000,
            'harga_diskon' => null,
            'ppn' => 11,
            'tax' => 'include tax',
            'margin' => 50,
            'diskon' => 'no',
            'stok' => 10,
            'min_stok' => 0,
            'keterangan' => fake()->sentence(),
            'id_kategori' => 1,
        ];
    }

    public function lowStock(int $minStok = 5): static
    {
        return $this->state(fn (array $attributes) => [
            'stok' => $minStok - 1,
            'min_stok' => $minStok,
        ]);
    }
}
