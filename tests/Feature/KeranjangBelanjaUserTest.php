<?php

use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createUserCartProduk(Outlet $outlet, User $user, string $namaProduk): Produk
{
    $kategori = Kategori::create(['id_user' => $user->id, 'kategori' => 'Keranjang '.fake()->unique()->word()]);
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

it('adds a product to the user cart as pending', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)
        ->post(route('cart.add', $produk), ['jumlah_produk' => 2])
        ->assertRedirect();

    $this->assertDatabaseHas('keranjang_belanja_users', [
        'id_user' => $user->id,
        'id_kategori' => $produk->id_kategori,
        'id_produk' => $produk->id,
        'jumlah_produk' => 2,
        'status' => 'pending',
    ]);
});

it('increments the quantity when the same product is added again', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)->post(route('cart.add', $produk), ['jumlah_produk' => 1])->assertRedirect();
    $this->actingAs($user)->post(route('cart.add', $produk), ['jumlah_produk' => 2])->assertRedirect();

    expect(KeranjangBelanjaUser::where('id_user', $user->id)->count())->toBe(1);
    expect(KeranjangBelanjaUser::where('id_user', $user->id)->first()->jumlah_produk)->toBe(3);
});

it('rejects a quantity below one', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)
        ->post(route('cart.add', $produk), ['jumlah_produk' => 0])
        ->assertSessionHasErrors('jumlah_produk');

    $this->assertDatabaseCount('keranjang_belanja_users', 0);
});

it('rejects a quantity greater than the available stock', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)
        ->post(route('cart.add', $produk), ['jumlah_produk' => 6])
        ->assertSessionHasErrors('jumlah_produk');

    $this->assertDatabaseCount('keranjang_belanja_users', 0);
});

it('rejects adding a product that has no stock', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk Habis');
    $produk->update(['stok' => 0]);

    $this->actingAs($user)
        ->post(route('cart.add', $produk), ['jumlah_produk' => 1])
        ->assertSessionHasErrors('produk');

    $this->assertDatabaseCount('keranjang_belanja_users', 0);
});

it('requires authentication to add a product to the cart', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->post(route('cart.add', $produk), ['jumlah_produk' => 1])->assertRedirect(route('login'));

    $this->assertDatabaseCount('keranjang_belanja_users', 0);
});

it('shares the pending cart count to authenticated pages', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produkA = createUserCartProduk($outlet, $user, 'Produk A');
    $produkB = createUserCartProduk($outlet, $user, 'Produk B');

    $this->actingAs($user)->post(route('cart.add', $produkA), ['jumlah_produk' => 2])->assertRedirect();
    $this->actingAs($user)->post(route('cart.add', $produkB), ['jumlah_produk' => 3])->assertRedirect();

    $this->actingAs($user)
        ->get(route('homepage'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('cartCount', 5));
});

it('only counts pending cart items owned by the current user', function () {
    $outlet = createOutlet();
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $produk = createUserCartProduk($outlet, $userA, 'Produk A');

    $this->actingAs($userA)->post(route('cart.add', $produk), ['jumlah_produk' => 4])->assertRedirect();

    $this->actingAs($userB)
        ->get(route('homepage'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('cartCount', 0));
});

it('shows the pending cart items on the orders page', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)->post(route('cart.add', $produk), ['jumlah_produk' => 2])->assertRedirect();

    $this->actingAs($user)
        ->get(route('pesanan_saya'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pesanan_saya')
            ->has('cartItems', 1)
            ->where('cartItems.0.nama_produk', 'Produk User')
            ->where('cartItems.0.jumlah', 2)
            ->where('cartItems.0.subtotal', 2 * ($produk->harga_diskon ?? $produk->harga))
            ->where('total', 2 * ($produk->harga_diskon ?? $produk->harga)));
});

it('excludes completed cart items from the orders page', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)->post(route('cart.add', $produk), ['jumlah_produk' => 1])->assertRedirect();

    KeranjangBelanjaUser::where('id_user', $user->id)->update(['status' => 'done']);

    $this->actingAs($user)
        ->get(route('pesanan_saya'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('cartItems', 0)
            ->where('total', 0));
});

it('only shows the current user cart items on the orders page', function () {
    $outlet = createOutlet();
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $produk = createUserCartProduk($outlet, $userA, 'Produk A');

    $this->actingAs($userA)->post(route('cart.add', $produk), ['jumlah_produk' => 2])->assertRedirect();

    $this->actingAs($userB)
        ->get(route('pesanan_saya'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('cartItems', 0)
            ->where('total', 0));
});

it('deletes a pending cart item owned by the user', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produk = createUserCartProduk($outlet, $user, 'Produk User');

    $this->actingAs($user)->post(route('cart.add', $produk), ['jumlah_produk' => 2])->assertRedirect();

    $cartItem = KeranjangBelanjaUser::where('id_user', $user->id)->firstOrFail();

    $this->actingAs($user)
        ->delete(route('pesanan_saya.delete', $cartItem))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(KeranjangBelanjaUser::find($cartItem->id))->toBeNull();
});

it('forbids deleting another user cart item', function () {
    $outlet = createOutlet();
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $produk = createUserCartProduk($outlet, $userA, 'Produk A');

    $this->actingAs($userA)->post(route('cart.add', $produk), ['jumlah_produk' => 2])->assertRedirect();

    $cartItem = KeranjangBelanjaUser::where('id_user', $userA->id)->firstOrFail();

    $this->actingAs($userB)
        ->delete(route('pesanan_saya.delete', $cartItem))
        ->assertForbidden();

    expect(KeranjangBelanjaUser::find($cartItem->id))->not->toBeNull();
});

it('checks out all pending cart items', function () {
    $outlet = createOutlet();
    $user = User::factory()->create();
    $produkA = createUserCartProduk($outlet, $user, 'Produk A');
    $produkB = createUserCartProduk($outlet, $user, 'Produk B');

    $this->actingAs($user)->post(route('cart.add', $produkA), ['jumlah_produk' => 1])->assertRedirect();
    $this->actingAs($user)->post(route('cart.add', $produkB), ['jumlah_produk' => 3])->assertRedirect();

    $this->actingAs($user)
        ->post(route('pesanan_saya.checkout'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(KeranjangBelanjaUser::where('id_user', $user->id)->where('status', 'pending')->count())->toBe(0);
    expect(KeranjangBelanjaUser::where('id_user', $user->id)->where('status', 'done')->count())->toBe(2);
});

it('rejects checkout when the cart is empty', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('pesanan_saya.checkout'))
        ->assertRedirect()
        ->assertSessionHas('error');
});
