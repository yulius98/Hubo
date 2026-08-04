<?php

use App\Models\Kategori;
use App\Models\Produk;
use App\Models\RequestRole;
use App\Models\User;

it('only the owner of an outlet can update it', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $other = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), createOutlet(), 'owner outlet');

    expect($owner->can('update', $outlet))->toBeTrue();
    expect($other->can('update', $outlet))->toBeFalse();
});

it('owner and admin can create products but cashier cannot', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $cashier = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    expect($owner->can('create', [Produk::class, $outlet]))->toBeTrue();
    expect($admin->can('create', [Produk::class, $outlet]))->toBeTrue();
    expect($cashier->can('create', [Produk::class, $outlet]))->toBeFalse();
});

it('only owner and admin of a product outlet can delete it', function () {
    $outlet = createOutlet();
    $kategoriOwner = User::factory()->create();
    $kategori = Kategori::create(['id_user' => $kategoriOwner->id, 'kategori' => 'Minuman']);
    $kategori->outlets()->attach($outlet->id);
    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Teh',
        'harga_beli' => 3000,
        'margin' => 2000,
        'harga' => 5000,
    ]);

    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $cashier = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    expect($admin->can('delete', $produk))->toBeTrue();
    expect($cashier->can('delete', $produk))->toBeFalse();
});

it('only owner and admin of an outlet can create categories', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $cashier = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    expect($owner->can('create', [Kategori::class, $outlet]))->toBeTrue();
    expect($admin->can('create', [Kategori::class, $outlet]))->toBeTrue();
    expect($cashier->can('create', [Kategori::class, $outlet]))->toBeFalse();
});

it('only the owner of the request outlet can approve a staff request', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), createOutlet(), 'owner outlet');

    $requestRole = RequestRole::create([
        'user_id' => User::factory()->create()->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);

    expect($owner->can('approve', $requestRole))->toBeTrue();
    expect($otherOwner->can('approve', $requestRole))->toBeFalse();
});
