<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\ProductVariant;
use App\Models\Produk;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->owner = createUserWithGlobalRole('owner outlet');
    $this->company = Company::factory()->create();

    $this->outlet = createOutlet([
        'company_id' => $this->company->id,
        'nama_outlet' => 'Toko Sejahtera',
        'slug' => 'toko-sejahtera',
    ]);
    $this->owner->outlets()->attach($this->outlet->id, ['role_id' => roleId('owner outlet')]);

    $this->kategori = Kategori::create(['id_user' => $this->owner->id, 'kategori' => 'Minuman']);
    $this->kategori->outlets()->attach($this->outlet->id);

    $this->produk = Produk::factory()->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Kopi Susu',
        'stok' => 10,
    ]);
});

it('renders the storefront for a valid outlet slug', function () {
    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/index')
            ->where('outlet.nama_outlet', 'Toko Sejahtera'));
});

it('returns 404 for an unknown outlet slug', function () {
    $this->get(route('storefront', ['slug' => 'tidak-ada']))
        ->assertNotFound();
});

it('shows the in-stock product in the storefront', function () {
    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/index')
            ->has('products.data', 1)
            ->where('products.data.0.nama_produk', 'Kopi Susu'));
});

it('hides the out-of-stock product from the storefront', function () {
    $this->produk->update(['stok' => 0]);

    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 0));
});

it('shows a product with an active in-stock variant only', function () {
    $this->produk->update(['stok' => 0]);
    ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 5, 'is_active' => true]);

    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1));
});

it('does not show a product whose only variant is inactive', function () {
    $this->produk->update(['stok' => 0]);
    ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 5, 'is_active' => false]);

    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 0));
});

it('does not leak products of the other outlet on the storefront', function () {
    $otherOutlet = createOutlet(['company_id' => $this->company->id, 'slug' => 'toko-lain']);
    Produk::factory()->create([
        'id_outlet' => $otherOutlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Toko Lain',
        'stok' => 10,
    ]);

    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.nama_produk', 'Kopi Susu'));
});
