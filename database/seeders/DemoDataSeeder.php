<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed the complete demo tenancy.
     *
     * Kept as a thin wrapper so existing test suites and the tenant seeder
     * stay compatible with the idempotent TenantSeeder + DemoCatalogSeeder
     * split.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PlanSeeder::class,
            TenantSeeder::class,
            DemoCatalogSeeder::class,
        ]);
    }
}
