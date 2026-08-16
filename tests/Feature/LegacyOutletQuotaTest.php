<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\RequestRole;
use App\Models\User;

it('allows a legacy outlet without a company to keep adding products', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = Outlet::create([
        'nama_outlet' => 'Legacy Outlet',
        'alamat_outlet' => 'Jalan Melati No. 2',
        'kota' => 'Bandung',
        'telp' => '0811-2222-3333',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Makanan']);
    $kategori->outlets()->attach($outlet->id);

    $this->actingAs($owner)->post(route('produk.add'), [
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Nasi Goreng',
        'harga_beli' => 10000,
        'margin' => 20,
        'ppn' => 11,
        'tax' => 'tanpa pajak',
        'diskon' => 'no',
        'stok' => 0,
    ])->assertRedirect();

    expect(Produk::where('nama_produk', 'Nasi Goreng')->exists())->toBeTrue();
});

it('allows approving staff for a legacy outlet without a company', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = Outlet::create([
        'nama_outlet' => 'Legacy Outlet 2',
        'alamat_outlet' => 'Jalan Mawar No. 3',
        'kota' => 'Surabaya',
        'telp' => '0811-3333-4444',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');

    $staff = User::factory()->create();
    $requestRole = RequestRole::create([
        'user_id' => $staff->id,
        'outlet_id' => $outlet->id,
        'role_id' => roleId('kasir'),
        'owner_id' => $owner->id,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id), [])->assertRedirect();

    expect($staff->hasOutletRole($outlet, 'kasir'))->toBeTrue();
});
