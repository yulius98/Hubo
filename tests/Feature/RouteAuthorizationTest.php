<?php

use App\Models\Kategori;
use App\Models\Produk;
use App\Models\RequestRole;
use App\Models\User;

it('allows owner and admin but denies kasir and plain user on kategori routes', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($owner)->get(route('kategori'))->assertOk();
    $this->actingAs($admin)->get(route('kategori'))->assertOk();
    $this->actingAs($kasir)->get(route('kategori'))->assertForbidden();

    $plainUser = User::factory()->create();
    $this->actingAs($plainUser)->get(route('kategori'))->assertForbidden();
});

it('allows owner, admin and kasir of an outlet to view its products', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($owner)->get(route('produk', $outlet->id))->assertOk();
    $this->actingAs($admin)->get(route('produk', $outlet->id))->assertOk();
    $this->actingAs($kasir)->get(route('produk', $outlet->id))->assertOk();
});

it('denies kasir of another outlet and plain user on produk routes', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $kasirOfOther = attachUserToOutlet(createUserWithGlobalRole('kasir'), $otherOutlet, 'kasir');

    $this->actingAs($kasirOfOther)->get(route('produk', $outlet->id))->assertForbidden();

    $plainUser = User::factory()->create();
    $this->actingAs($plainUser)->get(route('produk', $outlet->id))->assertForbidden();
});

it('allows owner and admin but denies kasir when storing products', function () {
    $outlet = createOutlet();
    $kategori = Kategori::create([
        'id_user' => User::factory()->create()->id,
        'kategori' => 'Minuman',
    ]);
    $kategori->outlets()->attach($outlet->id);

    $payload = [
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Jeruk',
        'keterangan' => 'Segar',
        'harga_beli' => 3000,
        'harga' => 5000,
        'diskon' => 'no',
    ];

    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $this->actingAs($owner)->post(route('produk.add'), $payload)->assertRedirect();

    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $this->actingAs($kasir)->post(route('produk.add'), $payload)->assertForbidden();

    expect(Produk::where('nama_produk', 'Es Jeruk')->exists())->toBeTrue();
});

it('denies an owner from storing products in an outlet they do not own', function () {
    $ownedOutlet = createOutlet();
    $otherOutlet = createOutlet();
    $kategori = Kategori::create([
        'id_user' => User::factory()->create()->id,
        'kategori' => 'Minuman',
    ]);
    $kategori->outlets()->attach($otherOutlet->id);

    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');

    $this->actingAs($owner)->post(route('produk.add'), [
        'id_outlet' => $otherOutlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Jeruk B',
        'harga_beli' => 3000,
        'harga' => 5000,
        'diskon' => 'no',
    ])->assertForbidden();
});

it('allows only the owner of an outlet to update or delete it', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOutlet = createOutlet();
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    $this->actingAs($owner)->put(route('myoutlet.update', $outlet), [
        'nama_outlet' => 'Outlet Baru',
        'alamat_outlet' => 'Jalan Melati',
        'kota' => 'Bandung',
        'telp' => '0812-1111-1111',
    ])->assertRedirect();

    $this->actingAs($owner)->delete(route('myoutlet.delete', $outlet))->assertRedirect();

    $this->actingAs($otherOwner)->put(route('myoutlet.update', $otherOutlet), [
        'nama_outlet' => 'Outlet Lain',
        'alamat_outlet' => 'Jalan Kenanga',
        'kota' => 'Jakarta',
        'telp' => '0812-2222-2222',
    ])->assertRedirect();
});

it('denies a non-owner and an owner of another outlet from deleting an outlet', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    $plainUser = User::factory()->create();
    $this->actingAs($plainUser)->delete(route('myoutlet.delete', $outlet))->assertForbidden();
    $this->actingAs($otherOwner)->delete(route('myoutlet.delete', $outlet))->assertForbidden();
});

it('allows any authenticated user to open a new outlet', function () {
    seedRoles();
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Outlet Baru Saya',
        'alamat_outlet' => 'Jalan Mawar',
        'kota' => 'Jakarta',
        'telp' => '0812-3333-3333',
    ])->assertRedirect();

    expect($plainUser->hasRole('owner outlet'))->toBeTrue();
});

it('allows only the owner of an outlet to view its staff requests', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->get(route('add_staff', $outlet->id))->assertOk();

    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $this->actingAs($admin)->get(route('add_staff', $outlet->id))->assertForbidden();
});

it('allows only the owner of the request outlet to approve a staff request', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOutlet = createOutlet();
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    $requestRole = RequestRole::create([
        'user_id' => User::factory()->create()->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id))->assertRedirect();
    $this->actingAs($otherOwner)->post(route('terima_staff', $requestRole->id))->assertForbidden();
});

it('allows kasir and owner outlet but denies admin and plain user on cashier route', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');

    $this->actingAs($kasir)->get(route('cashier'))->assertOk();
    $this->actingAs($owner)->get(route('cashier'))->assertOk();
    $this->actingAs($admin)->get(route('cashier'))->assertForbidden();

    $plainUser = User::factory()->create();
    $this->actingAs($plainUser)->get(route('cashier'))->assertForbidden();
});

it('forces a kasir to use their own outlet on the cashier page', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $kasir = attachUserToOutlet($kasir, $otherOutlet, 'kasir');

    session(['selected_outlet_id' => $otherOutlet->id]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('outlet.id', $outlet->id));
});

it('only allows a user to select an outlet they belong to', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $user = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($user)
        ->post(route('select-outlet'), ['outlet_id' => $outlet->id])
        ->assertRedirect()
        ->assertSessionHas('selected_outlet_id', $outlet->id);

    $this->actingAs($user)
        ->post(route('select-outlet'), ['outlet_id' => $otherOutlet->id])
        ->assertForbidden();
});
