<?php

use App\Http\Middleware\SetTenantContext;
use App\Models\Company;
use App\Models\Kategori;
use App\Models\Plan;
use App\Models\Produk;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpException;

it('allows creation when the company has no assigned plan', function () {
    $company = Company::factory()->create();

    expect(app(SubscriptionService::class)->canCreate($company, 'outlets'))->toBeTrue();
});

it('enforces the outlet limit of a plan', function () {
    $plan = Plan::factory()->create(['max_outlets' => 1]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $service = app(SubscriptionService::class);
    expect($service->canCreate($company, 'outlets'))->toBeTrue();

    createOutlet(['company_id' => $company->id]);

    expect($service->canCreate($company, 'outlets'))->toBeFalse();
    expect(fn () => $service->assertCanCreate($company, 'outlets'))
        ->toThrow(HttpException::class, 'Batas jumlah outlet');
});

it('enforces the product limit of a plan', function () {
    $plan = Plan::factory()->create(['max_outlets' => 5, 'max_products' => 1]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    $kategori = Kategori::create([
        'id_user' => User::factory()->create()->id,
        'kategori' => 'Minuman',
    ]);
    $kategori->outlets()->attach($outlet->id);

    Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Teh',
        'harga_beli' => 2000,
        'margin' => 0,
        'harga' => 3000,
        'tax' => 'tanpa pajak',
        'stok' => 0,
    ]);

    $service = app(SubscriptionService::class);
    expect($service->canCreate($company, 'products'))->toBeFalse();
    expect(fn () => $service->assertCanCreate($company, 'products'))
        ->toThrow(HttpException::class, 'Batas jumlah produk');
});

it('treats unlimited plans as always affordable', function () {
    $plan = Plan::factory()->unlimited()->create();
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    createOutlet(['company_id' => $company->id]);

    expect(app(SubscriptionService::class)->canCreate($company, 'outlets'))->toBeTrue();
});

it('blocks a request once the tenant outlet quota is reached', function () {
    Route::middleware(['web', 'auth', SetTenantContext::class, 'quota:outlets'])
        ->get('/_test/quota-outlets', fn () => 'ok');

    $plan = Plan::factory()->create(['max_outlets' => 1]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $user = createUserWithGlobalRole('owner outlet');
    $user->update(['company_id' => $company->id]);

    $this->actingAs($user)->get('/_test/quota-outlets')->assertOk();

    createOutlet(['company_id' => $company->id]);

    $this->actingAs($user)->get('/_test/quota-outlets')->assertForbidden();
});

it('blocks creating a product once the plan product limit is reached', function () {
    seedRoles();

    $plan = Plan::factory()->create(['max_outlets' => 5, 'max_products' => 1, 'max_staff' => 3]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $kategori = Kategori::create([
        'id_user' => $owner->id,
        'kategori' => 'Minuman',
    ]);
    $kategori->outlets()->attach($outlet->id);

    Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Teh',
        'harga_beli' => 2000,
        'margin' => 0,
        'harga' => 3000,
        'tax' => 'tanpa pajak',
        'stok' => 0,
    ]);

    $this->actingAs($owner)->post(route('produk.add'), [
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Jeruk',
        'harga_beli' => 3000,
        'margin' => 25,
        'ppn' => 11,
        'tax' => 'tanpa pajak',
        'diskon' => 'no',
    ])->assertForbidden();

    expect(Produk::where('nama_produk', 'Es Jeruk')->doesntExist())->toBeTrue();
});
