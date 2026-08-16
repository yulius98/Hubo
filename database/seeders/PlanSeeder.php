<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Gratis',
                'slug' => 'gratis',
                'description' => 'Paket awal untuk usaha yang baru memulai. 1 outlet, produk dan karyawan terbatas.',
                'price_monthly' => 0,
                'max_outlets' => 1,
                'max_products' => 50,
                'max_staff' => 3,
                'trial_days' => 14,
                'is_active' => true,
                'features' => [],
            ],
            [
                'name' => 'Standard',
                'slug' => 'standard',
                'description' => 'Paket untuk usaha yang sedang bertumbuh dengan lebih banyak outlet, produk dan karyawan.',
                'price_monthly' => 149000,
                'max_outlets' => 5,
                'max_products' => 1000,
                'max_staff' => 10,
                'trial_days' => 14,
                'is_active' => true,
                'features' => [
                    'multi_kasir',
                    'laporan_lanjutan',
                ],
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Paket tanpa batas untuk bisnis yang sudah berkembang pesat.',
                'price_monthly' => 499000,
                'max_outlets' => null,
                'max_products' => null,
                'max_staff' => null,
                'trial_days' => 14,
                'is_active' => true,
                'features' => [
                    'multi_kasir',
                    'laporan_lanjutan',
                    'multi_outlet',
                    'api_akses',
                ],
            ],
        ];

        foreach ($plans as $plan) {
            $features = $plan['features'];
            unset($plan['features']);

            $planModel = Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );

            $planModel->features()->delete();
            $planModel->features()->createMany(
                collect($features)->map(fn (string $feature) => [
                    'feature' => $feature,
                    'value' => '1',
                ])->all()
            );
        }
    }
}
