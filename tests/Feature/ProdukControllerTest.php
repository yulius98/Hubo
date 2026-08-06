<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;

function createProdukCategory(Outlet $outlet, User $user): Kategori
{
    $kategori = Kategori::create([
        'id_user' => $user->id,
        'kategori' => 'Kategori '.fake()->unique()->word(),
    ]);
    $kategori->outlets()->attach($outlet->id);

    return $kategori;
}

function produkPayload(Outlet $outlet, Kategori $kategori, array $overrides = []): array
{
    return array_merge([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk '.fake()->unique()->word(),
        'keterangan' => 'Deskripsi produk',
        'harga_beli' => 8000,
        'margin' => 25,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
        'harga_diskon' => null,
    ], $overrides);
}

it('computes the selling price including PPN when tax is include tax', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['harga_beli' => 8000, 'margin' => 25, 'ppn' => 11, 'tax' => 'include tax'])
    )->assertRedirect();

    $produk = Produk::latest('id')->first();
    expect((float) $produk->harga)->toBe(11100.0);
    expect((float) $produk->ppn)->toBe(11.0);
    expect($produk->tax)->toBe('include tax');
});

it('computes the selling price without PPN when tax is exclude tax', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['harga_beli' => 10000, 'margin' => 10, 'ppn' => 10, 'tax' => 'exclude tax'])
    )->assertRedirect();

    $produk = Produk::latest('id')->first();
    expect((float) $produk->harga)->toBe(11000.0);
});

it('computes the selling price without PPN when tax is tanpa pajak', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['harga_beli' => 10000, 'margin' => 10, 'ppn' => 10, 'tax' => 'tanpa pajak'])
    )->assertRedirect();

    $produk = Produk::latest('id')->first();
    expect((float) $produk->harga)->toBe(11000.0);
});

it('stores the manual margin percentage without recalculating it', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['harga_beli' => 10000, 'margin' => 12.5, 'tax' => 'tanpa pajak'])
    )->assertRedirect();

    $produk = Produk::latest('id')->first();
    expect((float) $produk->margin)->toBe(12.5);
    expect((float) $produk->harga)->toBe(11250.0);
});

it('stores zero margin when margin is zero', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['harga_beli' => 5000, 'margin' => 0, 'tax' => 'tanpa pajak'])
    )->assertRedirect();

    $produk = Produk::latest('id')->first();
    expect((float) $produk->margin)->toBe(0.0);
    expect((float) $produk->harga)->toBe(5000.0);
});

it('requires margin, ppn and tax when creating a product', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $payload = produkPayload($outlet, $kategori);
    unset($payload['margin'], $payload['ppn'], $payload['tax']);

    $this->actingAs($owner)
        ->post(route('produk.add'), $payload)
        ->assertSessionHasErrors(['margin', 'ppn', 'tax']);

    expect(Produk::count())->toBe(0);
});

it('rejects an invalid PPN value', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $this->actingAs($owner)
        ->post(route('produk.add'), produkPayload($outlet, $kategori, ['ppn' => 12]))
        ->assertSessionHasErrors('ppn');
});

it('recalculates the selling price when updating a product', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk '.fake()->unique()->word(),
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
    ]);

    $this->actingAs($owner)->put(
        route('produk.update', $produk),
        produkPayload($outlet, $kategori, ['harga_beli' => 5000, 'margin' => 20, 'ppn' => 10, 'tax' => 'include tax'])
    )->assertRedirect();

    $produk->refresh();
    expect((float) $produk->margin)->toBe(20.0);
    expect((float) $produk->harga)->toBe(6600.0);
});

it('allows the same product name across different outlets', function () {
    $outletA = createOutlet();
    $ownerA = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $kategoriA = createProdukCategory($outletA, $ownerA);

    $outletB = createOutlet();
    $ownerB = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletB, 'owner outlet');
    $kategoriB = createProdukCategory($outletB, $ownerB);

    $name = 'Produk '.fake()->unique()->word();

    $this->actingAs($ownerA)->post(
        route('produk.add'),
        produkPayload($outletA, $kategoriA, ['nama_produk' => $name])
    )->assertRedirect();

    $this->actingAs($ownerB)->post(
        route('produk.add'),
        produkPayload($outletB, $kategoriB, ['nama_produk' => $name])
    )->assertRedirect();

    expect(Produk::where('nama_produk', $name)->count())->toBe(2);
});

it('rejects a duplicate product name within the same outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $name = 'Produk '.fake()->unique()->word();

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['nama_produk' => $name])
    )->assertRedirect();

    $this->actingAs($owner)->post(
        route('produk.add'),
        produkPayload($outlet, $kategori, ['nama_produk' => $name])
    )->assertSessionHasErrors('nama_produk');

    expect(Produk::where('nama_produk', $name)->count())->toBe(1);
});

it('allows keeping the same product name when updating it', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = createProdukCategory($outlet, $owner);

    $name = 'Produk '.fake()->unique()->word();

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => $name,
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
    ]);

    $this->actingAs($owner)->put(
        route('produk.update', $produk),
        produkPayload($outlet, $kategori, ['nama_produk' => $name])
    )->assertRedirect();

    expect(Produk::where('nama_produk', $name)->count())->toBe(1);
});
