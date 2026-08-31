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
            SuperAdminSeeder::class,
            KategoriSeeder::class,
        ]);

        $this->call([
            DemoDataSeeder::class,
        ]);

        // Outlet::factory(100)->create();

        // $datarole = [];
        // for ($i = 2; $i <= 101; $i++) {
        //     $datarole[] = [
        //         'user_id' => $i,
        //         'role_id' => 2,
        //         'created_at' => now(),
        //         'updated_at' => now(),
        //     ];
        // };
        // DB::table('role_user')->insert($datarole);

        // $dataoutlet =[];
        // for ($i = 2; $i <= 101; $i++) {
        //     $dataoutlet[] = [
        //         'user_id' => $i,
        //         'outlet_id' => $i-1,
        //         'role_id' => 2,
        //         'created_at' => now(),
        //         'updated_at' => now(),
        //     ];
        // };

        // DB::table('outlet_user')->insert($dataoutlet);

    }
}
