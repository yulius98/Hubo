<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createStokProduk(Outlet $outlet, User $owner, int $stok = 0, ?string $namaProduk = null): Produk
{
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Stok '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    return Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => $namaProduk ?? 'Produk '.fake()->unique()->word(),
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
        'stok' => $stok,
    ]);
}

it('shows the stock page with products and history for the selected outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 10);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('kelola_stok'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/kelola_stok')
            ->where('selectedOutletId', $outlet->id)
            ->where('outlet.id', $outlet->id)
            ->has('produks', 1)
            ->where('produks.0.nama_produk', $produk->nama_produk)
        );
});

it('denies the stock page to a kasir role', function () {
    $outlet = createOutlet();
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($kasir)->get(route('kelola_stok'))->assertForbidden();
});

it('records an IN movement and increases the product stock', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 5);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 3,
        'keterangan' => 'Pembelian dari supplier',
    ])->assertRedirect();

    expect($produk->fresh()->stok)->toBe(8);

    $transaksi = Transaksi::where('id_produk', $produk->id)->firstOrFail();
    expect($transaksi->jenis_transaksi)->toBe('IN');
    expect($transaksi->jumlah_produk)->toBe(3);
    expect($transaksi->keterangan)->toBe('Pembelian dari supplier');
    expect($transaksi->id_user)->toBe($owner->id);
    expect($transaksi->id_outlet)->toBe($outlet->id);
});

it('records an OUT movement and decreases the product stock', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 10);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 4,
    ])->assertRedirect();

    expect($produk->fresh()->stok)->toBe(6);
    expect(Transaksi::where('id_produk', $produk->id)->firstOrFail()->jenis_transaksi)->toBe('OUT');
});

it('rejects an OUT movement that would make stock negative', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 2);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 5,
    ])->assertSessionHasErrors('jumlah_produk');

    expect($produk->fresh()->stok)->toBe(2);
    expect(Transaksi::count())->toBe(0);
});

it('allows an admin to record a stock movement', function () {
    $outlet = createOutlet();
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $produk = createStokProduk($outlet, $admin, 0);

    $this->actingAs($admin)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 2,
    ])->assertRedirect();

    expect($produk->fresh()->stok)->toBe(2);
});

it('denies a kasir from recording a stock movement', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createStokProduk($outlet, $owner, 5);

    $this->actingAs($kasir)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 1,
    ])->assertForbidden();

    expect($produk->fresh()->stok)->toBe(5);
    expect(Transaksi::count())->toBe(0);
});

it('denies recording a movement for an outlet the user does not manage', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($otherOutlet, $owner, 5);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 1,
    ])->assertForbidden();

    expect($produk->fresh()->stok)->toBe(5);
});

it('reverts an IN movement when deleting the history entry', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 5);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 3,
    ])->assertRedirect();

    $transaksi = Transaksi::where('id_produk', $produk->id)->firstOrFail();

    $this->actingAs($owner)->delete(route('kelola_stok.delete', $transaksi))->assertRedirect();

    expect($produk->fresh()->stok)->toBe(5);
    expect(Transaksi::find($transaksi->id))->toBeNull();
});

it('reverts an OUT movement when deleting the history entry', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 10);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 4,
    ])->assertRedirect();

    $transaksi = Transaksi::where('id_produk', $produk->id)->firstOrFail();

    $this->actingAs($owner)->delete(route('kelola_stok.delete', $transaksi))->assertRedirect();

    expect($produk->fresh()->stok)->toBe(10);
});

it('denies reverting a movement for an outlet the user does not manage', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');
    $produk = createStokProduk($outlet, $owner, 5);

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 2,
    ])->assertRedirect();

    $transaksi = Transaksi::where('id_produk', $produk->id)->firstOrFail();

    $this->actingAs($otherOwner)->delete(route('kelola_stok.delete', $transaksi))->assertForbidden();

    expect($produk->fresh()->stok)->toBe(7);
    expect(Transaksi::find($transaksi->id))->not->toBeNull();
});

it('validates the stock movement payload', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->post(route('kelola_stok.add'), [
        'id_produk' => 999999,
        'jenis_transaksi' => 'SIDEWAYS',
        'jumlah_produk' => 0,
    ])->assertSessionHasErrors(['id_produk', 'jenis_transaksi', 'jumlah_produk']);
});

it('does not leak products of other outlets when none selected', function () {
    $outletA = createOutlet();
    $outletB = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $owner = attachUserToOutlet($owner, $outletB, 'owner outlet');
    $produkA = createStokProduk($outletA, $owner, 1, 'Produk A');
    $produkB = createStokProduk($outletB, $owner, 2, 'Produk B');

    $this->actingAs($owner)
        ->get(route('kelola_stok'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedOutletId', 0)
            ->whereNull('outlet')
            ->has('produks', 2)
            ->where('produks.0.id', $produkA->id)
            ->where('produks.1.id', $produkB->id)
        );

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('kelola_stok'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedOutletId', $outletA->id)
            ->has('produks', 1)
            ->where('produks.0.id', $produkA->id)
        );
});
