<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the optional super admin account from environment configuration.
     *
     * The seeder is a no-op when SEED_ADMIN_EMAIL is not configured.
     */
    public function run(): void
    {
        $email = config('seed.admin_email');

        if ($email === null || trim((string) $email) === '') {
            $this->command?->warn('AdminSeeder dilewati: atur SEED_ADMIN_EMAIL di .env.');

            return;
        }

        $password = (string) config('seed.admin_password');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => (string) config('seed.admin_name', 'Admin Hubo'),
                'email_verified_at' => now(),
                'password' => trim($password) !== '' ? Hash::make($password) : null,
            ]
        );

        $user->role()->syncWithoutDetaching([
            Role::where('role', 'super admin')->firstOrFail()->id,
        ]);
    }
}
