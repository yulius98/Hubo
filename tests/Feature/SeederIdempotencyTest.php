<?php

use App\Models\Company;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('runs the production seeder twice without duplicating data', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(Company::count())->toBe(1)
        ->and(Company::where('slug', 'demo-toko')->count())->toBe(1)
        ->and(User::where('email', 'demo.owner@yopmail.com')->count())->toBe(1)
        ->and(User::where('email', 'demo.kasir@yopmail.com')->count())->toBe(1)
        ->and(Plan::count())->toBe(3)
        ->and(Outlet::where('company_id', Company::where('slug', 'demo-toko')->firstOrFail()->id)->count())->toBe(2);
});

it('skips admin seeding when SEED_ADMIN_EMAIL is not configured', function () {
    config(['seed.admin_email' => null]);

    $this->seed(DatabaseSeeder::class);

    expect(User::whereHas('role', fn ($query) => $query->where('role', 'super admin'))->count())->toBe(0);
});

it('creates the admin account from environment configuration', function () {
    config([
        'seed.admin_email' => 'admin.env@example.com',
        'seed.admin_name' => 'Env Admin',
        'seed.admin_password' => 'secret',
    ]);

    $this->seed(DatabaseSeeder::class);

    expect(User::where('email', 'admin.env@example.com')->exists())->toBeTrue();
});
