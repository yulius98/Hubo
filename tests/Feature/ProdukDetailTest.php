<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createDetailProduk(Outlet $outlet, User $user, string $namaProduk): Produk
{
    $kategori = Kategori::create(['id_user' => $user->id, 'kategori' => 'Detail '.fake()->unique()->word()]);
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

it('shares the product outlet as shipping address on the detail page', function () {
    $outlet = createOutlet([
        'nama_outlet' => 'Outlet Sentral',
        'alamat_outlet' => 'Jalan Merdeka No. 10',
        'kota' => 'Bandung',
    ]);
    $user = User::factory()->create();
    $produk = createDetailProduk($outlet, $user, 'Kopi Susu');

    $this->get(route('produk.detail', $produk))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('produk/detail')
            ->where('product.outlet.nama_outlet', 'Outlet Sentral')
            ->where('product.outlet.alamat_outlet', 'Jalan Merdeka No. 10')
            ->where('product.outlet.kota', 'Bandung'));
});
