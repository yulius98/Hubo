<?php

use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('demo seeder creates a complete active tenant', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();

    expect($company)->not->toBeNull()
        ->and($company->status)->toBe('active');
});

test('demo seeder creates an active subscription on the standard plan', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();
    $subscription = $company->subscription;

    expect($subscription)->not->toBeNull()
        ->and($subscription->status)->toBe(Subscription::STATUS_ACTIVE)
        ->and($subscription->plan->slug)->toBe('standard');
});

test('demo seeder creates owner, admin and kasir staff attached to outlet', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();

    $owner = User::where('email', 'demo.owner@yopmail.com')->first();
    $admin = User::where('email', 'demo.admin@yopmail.com')->first();
    $kasir = User::where('email', 'demo.kasir@yopmail.com')->first();

    expect($owner->company_id)->toBe($company->id)
        ->and($owner->hasRole('owner outlet'))->toBeTrue()
        ->and($admin->hasRole('admin outlet'))->toBeTrue()
        ->and($kasir->hasRole('kasir'))->toBeTrue();

    $adminOutlet = $admin->outlets->first();
    expect($adminOutlet)->not->toBeNull();

    expect($adminOutlet->pivot->role_id)->toBe(Role::where('role', 'admin outlet')->firstOrFail()->id);
});

test('demo seeder creates two outlets and a populated catalog', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();
    $outlets = $company->outlets()->orderBy('id')->get();

    expect($outlets)->toHaveCount(2);

    $mainOutlet = $outlets->first();
    $products = Produk::where('id_outlet', $mainOutlet->id)->get();

    expect($products)->not->toBeEmpty()
        ->and($products->every(fn (Produk $p) => $p->id_kategori !== null))->toBeTrue();

    $firstProduct = $products->first();

    expect(ProductVariant::where('produk_id', $firstProduct->id)->count())->toBeGreaterThanOrEqual(1);
});

test('categories are linked to the demo outlet', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();
    $mainOutlet = $company->outlets()->orderBy('id')->first();

    expect($mainOutlet->kategori()->count())->toBeGreaterThanOrEqual(1)
        ->and(Kategori::where('id_user', User::where('email', 'demo.owner@yopmail.com')->first()->id)->count())->toBeGreaterThanOrEqual(5);
});

test('demo seeder creates customers and coupons for the tenant', function () {
    $this->seed(DemoDataSeeder::class);

    $company = Company::where('slug', 'demo-toko')->first();

    expect(Customer::where('company_id', $company->id)->count())->toBe(3)
        ->and(Coupon::where('company_id', $company->id)->count())->toBe(2);
});

test('demo seeder is idempotent when run twice', function () {
    $this->seed(DemoDataSeeder::class);
    $this->seed(DemoDataSeeder::class);

    expect(Company::where('slug', 'demo-toko')->count())->toBe(1)
        ->and(User::where('email', 'demo.owner@yopmail.com')->count())->toBe(1)
        ->and(Outlet::where('company_id', Company::where('slug', 'demo-toko')->first()->id)->count())->toBe(2);
});
