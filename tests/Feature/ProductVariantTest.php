<?php

use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\User;

beforeEach(function () {
    $this->outlet = createOutlet();
    $this->owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $this->outlet, 'owner outlet');

    $this->kategori = Kategori::create(['id_user' => $this->owner->id, 'kategori' => 'Varian '.fake()->unique()->word()]);
    $this->kategori->outlets()->attach($this->outlet->id);

    $this->produk = Produk::create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Varian',
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'ppn' => 11,
        'tax' => 'include tax',
        'diskon' => 'no',
        'stok' => 20,
        'min_stok' => 3,
    ]);
});

it('adds a variant to a product', function () {
    $this->actingAs($this->owner)
        ->post(route('produk.variants.add', $this->produk), [
            'nama' => 'Ukuran S',
            'sku' => 'S-001',
            'harga' => 12500,
            'stok' => 8,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('product_variants', [
        'produk_id' => $this->produk->id,
        'nama' => 'Ukuran S',
        'sku' => 'S-001',
        'stok' => 8,
    ]);
});

it('fails when a variant sku is duplicated', function () {
    $this->actingAs($this->owner)
        ->post(route('produk.variants.add', $this->produk), [
            'nama' => 'Ukuran S',
            'sku' => 'S-001',
            'stok' => 8,
        ])
        ->assertRedirect();

    $this->actingAs($this->owner)
        ->post(route('produk.variants.add', $this->produk), [
            'nama' => 'Ukuran M',
            'sku' => 'S-001',
            'stok' => 5,
        ])
        ->assertSessionHasErrors('sku');

    expect(ProductVariant::count())->toBe(1);
});

it('updates a variant', function () {
    $variant = ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'nama' => 'Lama', 'stok' => 5]);

    $this->actingAs($this->owner)
        ->put(route('produk.variants.update', [$this->produk, $variant]), [
            'nama' => 'Baru',
            'sku' => 'B-001',
            'harga' => 15000,
            'stok' => 12,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($variant->fresh()->nama)->toBe('Baru');
    expect($variant->fresh()->stok)->toBe(12);
});

it('deletes a variant', function () {
    $variant = ProductVariant::factory()->create(['produk_id' => $this->produk->id]);

    $this->actingAs($this->owner)
        ->delete(route('produk.variants.delete', [$this->produk, $variant]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(ProductVariant::find($variant->id))->toBeNull();
});

it('sums active variant stock in effectiveStock', function () {
    ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 4, 'is_active' => true]);
    ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 6, 'is_active' => true]);
    ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 99, 'is_active' => false]);

    expect($this->produk->effectiveStock())->toBe(10);
});

it('falls back to the produk stock when no variants exist', function () {
    expect($this->produk->effectiveStock())->toBe(20);
});

it('adds a specific variant to the user cart', function () {
    $variant = ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 10]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('cart.add', $this->produk), [
            'jumlah_produk' => 3,
            'variant_id' => $variant->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('keranjang_belanja_users', [
        'id_user' => $user->id,
        'id_produk' => $this->produk->id,
        'variant_id' => $variant->id,
        'jumlah_produk' => 3,
    ]);
});

it('rejects adding a variant that does not belong to the product', function () {
    $otherProduk = Produk::create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Lain',
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'diskon' => 'no',
        'stok' => 10,
    ]);
    $otherVariant = ProductVariant::factory()->create(['produk_id' => $otherProduk->id, 'stok' => 10]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('cart.add', $this->produk), [
            'jumlah_produk' => 1,
            'variant_id' => $otherVariant->id,
        ])
        ->assertSessionHasErrors('variant_id');

    expect(KeranjangBelanjaUser::count())->toBe(0);
});

it('does not mix different variants of the same product in one cart row', function () {
    $s = ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 10]);
    $m = ProductVariant::factory()->create(['produk_id' => $this->produk->id, 'stok' => 10]);

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('cart.add', $this->produk), ['jumlah_produk' => 1, 'variant_id' => $s->id])->assertRedirect();
    $this->actingAs($user)->post(route('cart.add', $this->produk), ['jumlah_produk' => 2, 'variant_id' => $m->id])->assertRedirect();

    expect(KeranjangBelanjaUser::where('id_user', $user->id)->count())->toBe(2);
});
