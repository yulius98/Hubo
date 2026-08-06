<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createCashierProduk(Outlet $outlet, User $user, string $namaProduk): Produk
{
    $kategori = Kategori::create(['id_user' => $user->id, 'kategori' => 'Kasir '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    return Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => $namaProduk,
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
        'stok' => 5,
    ]);
}

it('shows the products of the first kasir outlet when none is selected', function () {
    $outlet = createOutlet(['nama_outlet' => 'Outlet A']);
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createCashierProduk($outlet, $kasir, 'Produk Kasir A');

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/Cashier_page')
            ->where('outlet.id', $outlet->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produk->id)
        );
});

it('shows the products of the selected outlet for a kasir', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');
    $kasir = attachUserToOutlet($kasir, $outletB, 'kasir');
    $produkA = createCashierProduk($outletA, $kasir, 'Produk Outlet A');
    $produkB = createCashierProduk($outletB, $kasir, 'Produk Outlet B');

    session(['selected_outlet_id' => $outletB->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletB->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkB->id)
        );

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletA->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkA->id)
        );
});

it('shows the products of the selected outlet for an owner', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $owner = attachUserToOutlet($owner, $outletB, 'owner outlet');
    $produkA = createCashierProduk($outletA, $owner, 'Produk Outlet A');
    createCashierProduk($outletB, $owner, 'Produk Outlet B');

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletA->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkA->id)
        );
});

it('falls back to the first kasir outlet when the selected outlet is not cashier-able', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');
    attachUserToOutlet($kasir, $outletB, 'admin outlet');
    $produkA = createCashierProduk($outletA, $kasir, 'Produk Outlet A');
    createCashierProduk($outletB, $kasir, 'Produk Outlet B');

    session(['selected_outlet_id' => $outletB->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletA->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkA->id)
        );
});

it('denies the cashier page to a user with no kasir or owned outlet', function () {
    $kasir = createUserWithGlobalRole('kasir');

    $this->actingAs($kasir)->get(route('cashier'))->assertForbidden();
});

it('does not mix products across outlets on the cashier page', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');
    $kasir = attachUserToOutlet($kasir, $outletB, 'kasir');
    $produkA = createCashierProduk($outletA, $kasir, 'Produk A');
    $produkB = createCashierProduk($outletB, $kasir, 'Produk B');

    session(['selected_outlet_id' => $outletB->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletB->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkB->id)
            ->where('produks.0.nama_produk', 'Produk B')
        );

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outletA->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkA->id)
            ->where('produks.0.nama_produk', 'Produk A')
        );
});

it('shows products for a kasir with the plain user global role too', function () {
    $user = App\Models\User::factory()->create();
    $user->role()->attach([roleId('user'), roleId('kasir')]);
    $outlet = createOutlet(['nama_outlet' => 'Laptop Era']);
    attachUserToOutlet($user, $outlet, 'kasir');
    $produk = createCashierProduk($outlet, $user, 'Lenovo');

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($user)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.id', $outlet->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produk->id)
            ->where('produks.0.nama_produk', 'Lenovo')
            ->where('produks.0.harga', $produk->harga)
        );
});

it('lists all attached outlets including the kasir outlet in the sidebar', function () {
    $ownedOutlet = createOutlet(['nama_outlet' => 'Outlet Milik']);
    $kasirOutlet = createOutlet(['nama_outlet' => 'Outlet Kasir']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');
    $owner = attachUserToOutlet($owner, $kasirOutlet, 'kasir');

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canSelectAll', true)
            ->has('sidebarOutlets', 2)
            ->where('sidebarOutlets.0.id', $kasirOutlet->id)
            ->where('sidebarOutlets.1.id', $ownedOutlet->id)
        );
});
