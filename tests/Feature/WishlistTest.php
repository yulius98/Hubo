<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->owner = createUserWithGlobalRole('owner outlet');
    $this->company = Company::factory()->create();
    $this->company->update(['status' => 'active']);

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

    $this->buyer = User::factory()->create(['company_id' => $this->company->id]);
});

it('redirects guests to login when toggling the wishlist', function () {
    $this->post(route('wishlist.toggle', ['produk' => $this->produk->id]))
        ->assertRedirect(route('login'));
});

it('adds a product to the wishlist', function () {
    $this->actingAs($this->buyer)
        ->post(route('wishlist.toggle', ['produk' => $this->produk->id]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($this->buyer->wishlist()->whereKey($this->produk->id)->exists())->toBeTrue();
});

it('removes the product from the wishlist on a second toggle', function () {
    $this->buyer->wishlist()->attach($this->produk->id);

    $this->actingAs($this->buyer)
        ->post(route('wishlist.toggle', ['produk' => $this->produk->id]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($this->buyer->wishlist()->whereKey($this->produk->id)->exists())->toBeFalse();
});

it('lists the wishlist products on the wishlist page', function () {
    $this->buyer->wishlist()->attach($this->produk->id);

    $this->actingAs($this->buyer)
        ->get(route('wishlist'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/wishlist')
            ->has('products', 1)
            ->where('products.0.nama_produk', 'Kopi Susu'));
});

it('exposes the wishlist count as a shared prop', function () {
    $this->buyer->wishlist()->attach($this->produk->id);

    $this->actingAs($this->buyer)
        ->get(route('wishlist'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('wishlistCount', 1));
});

it('marks the product as wishlisted on the detail page', function () {
    $this->buyer->wishlist()->attach($this->produk->id);

    $this->actingAs($this->buyer)
        ->get(route('produk.detail', ['produk' => $this->produk->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('produk/detail')
            ->where('is_wishlisted', true));
});

it('returns the wishlisted ids on the storefront for authenticated users', function () {
    $this->buyer->wishlist()->attach($this->produk->id);

    $this->actingAs($this->buyer)
        ->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/index')
            ->where('is_user_authenticated', true)
            ->where('wishlist_ids', [$this->produk->id]));
});

it('returns an empty wishlist ids list for guests on the storefront', function () {
    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/index')
            ->where('is_user_authenticated', false)
            ->where('wishlist_ids', []));
});

it('forbids wishing a product from another tenant', function () {
    $otherCompany = Company::factory()->create();
    $otherOutlet = createOutlet(['company_id' => $otherCompany->id]);
    $otherProduk = Produk::factory()->create([
        'id_outlet' => $otherOutlet->id,
        'nama_produk' => 'Teh Manis',
        'stok' => 5,
    ]);

    $this->actingAs($this->buyer)
        ->from('/')
        ->post(route('wishlist.toggle', ['produk' => $otherProduk->id]))
        ->assertForbidden();

    expect($this->buyer->wishlist()->whereKey($otherProduk->id)->exists())->toBeFalse();
});
