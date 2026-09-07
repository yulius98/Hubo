<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PlanSeeder::class,
        ]);

        if (config('seed.demo')) {
            $this->call([
                TenantSeeder::class,
                DemoCatalogSeeder::class,
            ]);
        }

        $this->call([
            AdminSeeder::class,
        ]);
    }
}
