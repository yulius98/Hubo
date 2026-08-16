<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * The email address used to identify the super admin account.
     */
    public string $email = 'hubo.admin@yopmail.com';

    /**
     * The display name for the super admin account.
     */
    public string $name = 'Admin Hubo';

    /**
     * Seed the application's super admin user.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => $this->email],
            ['name' => $this->name, 'email_verified_at' => now()]
        );

        $user->role()->syncWithoutDetaching([
            Role::where('role', 'super admin')->firstOrFail()->id,
        ]);
    }
}
