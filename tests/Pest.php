<?php

use App\Models\Outlet;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

function seedRoles(): void
{
    app(RoleSeeder::class)->run();
}

function roleId(string $roleName): int
{
    seedRoles();

    return Role::where('role', $roleName)->firstOrFail()->id;
}

function createUserWithGlobalRole(string $roleName): User
{
    $user = User::factory()->create();
    $user->role()->attach(roleId($roleName));

    return $user;
}

function createOutlet(array $attributes = []): Outlet
{
    return Outlet::create(array_merge([
        'nama_outlet' => 'Outlet '.fake()->unique()->word(),
        'alamat_outlet' => 'Jalan Mawar No. 1',
        'kota' => 'Jakarta',
        'telp' => '0812-3456-7890',
    ], $attributes));
}

function attachUserToOutlet(User $user, Outlet $outlet, string $roleName): User
{
    $user->outlets()->attach($outlet->id, ['role_id' => roleId($roleName)]);

    return $user;
}
