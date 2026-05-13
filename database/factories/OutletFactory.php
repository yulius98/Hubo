<?php

namespace Database\Factories;

use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outlet>
 */
class OutletFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_outlet' => fake()->company(),
            'alamat_outlet' => fake()->streetAddress(),
            'kota' => fake()->city(),
            'telp' => fake()->phoneNumber(),

        ];
    }
}
