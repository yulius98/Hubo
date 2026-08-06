<?php

use App\Models\Kategori;
use App\Models\KeranjangBelanjaKasir;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createKasirProduk(Outlet $outlet, User $user, string $namaProduk): Produk
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

it('adds a product to the kasir cart as pending', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    $this->actingAs($kasir)
        ->post(route('cashier.cart.add'), [
            'id_produk' => $produk->id,
            'id_kategori' => $produk->id_kategori,
            'jumlah_produk' => 2,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('keranjang_belanja_kasirs', [
        'id_user' => $kasir->id,
        'id_kategori' => $produk->id_kategori,
        'id_produk' => $produk->id,
        'jumlah_produk' => 2,
        'status' => 'pending',
    ]);
});

it('increments the quantity when the same product is added again', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    $payload = [
        'id_produk' => $produk->id,
        'id_kategori' => $produk->id_kategori,
        'jumlah_produk' => 1,
    ];

    $this->actingAs($kasir)->post(route('cashier.cart.add'), $payload)->assertRedirect();
    $this->actingAs($kasir)->post(route('cashier.cart.add'), $payload)->assertRedirect();

    expect(KeranjangBelanjaKasir::where('id_user', $kasir->id)->count())->toBe(1);
    expect(KeranjangBelanjaKasir::where('id_user', $kasir->id)->first()->jumlah_produk)->toBe(2);
});

it('rejects a quantity below one', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    $this->actingAs($kasir)
        ->from(route('cashier'))
        ->post(route('cashier.cart.add'), [
            'id_produk' => $produk->id,
            'id_kategori' => $produk->id_kategori,
            'jumlah_produk' => 0,
        ])
        ->assertSessionHasErrors('jumlah_produk');

    $this->assertDatabaseCount('keranjang_belanja_kasirs', 0);
});

it('rejects a category that does not match the product', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');
    $otherKategori = Kategori::create(['id_user' => $kasir->id, 'kategori' => 'Kategori Lain']);

    $this->actingAs($kasir)
        ->from(route('cashier'))
        ->post(route('cashier.cart.add'), [
            'id_produk' => $produk->id,
            'id_kategori' => $otherKategori->id,
            'jumlah_produk' => 1,
        ])
        ->assertSessionHasErrors('id_kategori');

    $this->assertDatabaseCount('keranjang_belanja_kasirs', 0);
});

it('forbids adding a product from an outlet the user does not serve', function () {
    $outletA = createOutlet();
    $outletB = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');
    $produkB = createKasirProduk($outletB, $kasir, 'Produk Outlet B');

    $this->actingAs($kasir)
        ->post(route('cashier.cart.add'), [
            'id_produk' => $produkB->id,
            'id_kategori' => $produkB->id_kategori,
            'jumlah_produk' => 1,
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('keranjang_belanja_kasirs', 0);
});

it('removes a cart item for its owner', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    $this->actingAs($kasir)->post(route('cashier.cart.add'), [
        'id_produk' => $produk->id,
        'id_kategori' => $produk->id_kategori,
        'jumlah_produk' => 1,
    ]);

    $item = KeranjangBelanjaKasir::first();

    $this->actingAs($kasir)
        ->delete(route('cashier.cart.delete', $item))
        ->assertRedirect();

    $this->assertSoftDeleted('keranjang_belanja_kasirs', ['id' => $item->id]);
});

it('forbids removing another user cart item', function () {
    $outlet = createOutlet();
    $kasir1 = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $kasir2 = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir1, 'Produk Kasir');

    $this->actingAs($kasir1)->post(route('cashier.cart.add'), [
        'id_produk' => $produk->id,
        'id_kategori' => $produk->id_kategori,
        'jumlah_produk' => 1,
    ]);

    $item = KeranjangBelanjaKasir::first();

    $this->actingAs($kasir2)
        ->delete(route('cashier.cart.delete', $item))
        ->assertForbidden();

    $this->assertDatabaseHas('keranjang_belanja_kasirs', ['id' => $item->id]);
});

it('passes the pending cart items to the cashier page', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($kasir)->post(route('cashier.cart.add'), [
        'id_produk' => $produk->id,
        'id_kategori' => $produk->id_kategori,
        'jumlah_produk' => 3,
    ]);

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/Cashier_page')
            ->has('keranjang', 1)
            ->where('keranjang.0.id', KeranjangBelanjaKasir::first()->id)
            ->where('keranjang.0.produk', 'Produk Kasir')
            ->where('keranjang.0.price', 11100)
            ->where('keranjang.0.quantity', 3)
        );
});

it('marks pending cart items as done after finalize and hides them from the page', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createKasirProduk($outlet, $kasir, 'Produk Kasir');

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($kasir)->post(route('cashier.cart.add'), [
        'id_produk' => $produk->id,
        'id_kategori' => $produk->id_kategori,
        'jumlah_produk' => 1,
    ]);

    $item = KeranjangBelanjaKasir::first();

    $this->actingAs($kasir)
        ->post(route('cashier.cart.finalize'))
        ->assertRedirect();

    expect($item->refresh()->status)->toBe('done');

    $this->actingAs($kasir)
        ->get(route('cashier'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/Cashier_page')
            ->has('keranjang', 0)
        );
});
