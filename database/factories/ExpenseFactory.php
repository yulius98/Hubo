<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Expense;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'outlet_id' => Outlet::factory(),
            'kategori' => fake()->randomElement(['sewa', 'gaji', 'listrik', 'air', 'transport', 'lainnya']),
            'jumlah' => fake()->randomFloat(2, 100000, 5000000),
            'keterangan' => fake()->sentence(),
            'tanggal' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }

    public function withoutOutlet(): static
    {
        return $this->state(fn (array $attributes) => [
            'outlet_id' => null,
        ]);
    }
}
