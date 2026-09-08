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

        $attrs = [
            'name' => (string) config('seed.admin_name', 'Admin Hubo'),
            'email_verified_at' => now(),
        ];

        // Only set the password when a new one is provided; otherwise keep the
        // existing password so re-seeding never locks out or resets an account.
        if (trim($password) !== '') {
            $attrs['password'] = Hash::make($password);
        }

        $user = User::updateOrCreate(['email' => $email], $attrs);

        $user->role()->syncWithoutDetaching([
            Role::where('role', 'super admin')->firstOrFail()->id,
        ]);
    }
}
