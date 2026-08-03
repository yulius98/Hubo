<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('role seeder does not create the admin app role', function () {
    seedRoles();

    expect(Role::where('role', 'admin app')->exists())->toBeFalse();
    expect(Role::whereIn('role', ['user', 'owner outlet', 'admin outlet', 'kasir'])->count())->toBe(4);
});

it('admin app role migration removes the role and detaches users', function () {
    $adminApp = Role::create(['role' => 'admin app']);
    $user = User::factory()->create();
    $user->role()->attach($adminApp->id);

    expect(DB::table('role_user')->where('role_id', $adminApp->id)->count())->toBe(1);

    $migration = require database_path('migrations/2026_08_03_000001_remove_admin_app_role.php');
    $migration->up();

    expect(Role::withTrashed()->where('role', 'admin app')->exists())->toBeTrue();
    expect(Role::where('role', 'admin app')->exists())->toBeFalse();
    expect(DB::table('role_user')->where('role_id', $adminApp->id)->count())->toBe(0);
});
