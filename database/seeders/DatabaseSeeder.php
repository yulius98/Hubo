<?php

namespace Database\Seeders;

use App\Models\User;
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
        ]);

        User::factory(1)->create();

        $this->call([
            KategoriSeeder::class,
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
