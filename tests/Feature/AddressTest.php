<?php

use App\Models\Address;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Order;
use App\Models\Produk;
use App\Models\User;

function createPayableShop(): array
{
    seedRoles();
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Alamat '.fake()->unique()->word(),
        'harga' => 100000,
        'harga_diskon' => null,
        'stok' => 10,
    ]);

    $buyer = User::factory()->create(['company_id' => $company->id]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    return [$buyer, $produk, $kategori];
}

it('requires authentication to manage addresses', function () {
    $this->get(route('user.addresses'))->assertRedirect(route('login'));
    $this->post(route('user.addresses.store'))->assertRedirect(route('login'));
});

it('creates an address and validates required fields', function () {
    seedRoles();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('user.addresses.store'), [
            'label' => 'Rumah',
            'nama_penerima' => 'Budi',
            'no_hp' => '0812-0000-1111',
            'provinsi' => 'DKI Jakarta',
            'kota_id' => '152',
            'kota' => 'Jakarta Selatan',
            'alamat' => 'Jl. Melati No. 12',
            'is_default' => true,
        ])
        ->assertRedirect(route('user.addresses'));

    $this->assertDatabaseHas('addresses', [
        'user_id' => $user->id,
        'label' => 'Rumah',
        'nama_penerima' => 'Budi',
        'alamat' => 'Jl. Melati No. 12',
        'is_default' => true,
    ]);

    $this->actingAs($user)
        ->post(route('user.addresses.store'), [
            'nama_penerima' => '',
            'no_hp' => '',
            'alamat' => '',
        ])
        ->assertSessionHasErrors(['nama_penerima', 'no_hp', 'alamat']);
});

it('keeps a single default address per user', function () {
    seedRoles();
    $user = User::factory()->create();

    $first = $user->addresses()->create([
        'nama_penerima' => 'Budi',
        'no_hp' => '0812-0000-1111',
        'alamat' => 'Jl. Melati No. 12',
        'is_default' => true,
    ]);

    $this->actingAs($user)->post(route('user.addresses.store'), [
        'nama_penerima' => 'Sari',
        'no_hp' => '0813-0000-1111',
        'alamat' => 'Jl. Anggrek No. 3',
        'is_default' => true,
    ]);

    expect($first->refresh()->is_default)->toBeFalse();
    expect(Address::where('user_id', $user->id)->where('is_default', true)->count())->toBe(1);
});

it('keeps an existing default when a non-default address is added', function () {
    seedRoles();
    $user = User::factory()->create();

    $default = $user->addresses()->create([
        'nama_penerima' => 'Budi',
        'no_hp' => '0812-0000-1111',
        'alamat' => 'Jl. Melati No. 12',
        'is_default' => true,
    ]);

    $this->actingAs($user)->post(route('user.addresses.store'), [
        'nama_penerima' => 'Sari',
        'no_hp' => '0813-0000-1111',
        'alamat' => 'Jl. Anggrek No. 3',
    ]);

    expect($default->refresh()->is_default)->toBeTrue()
        ->and(Address::where('user_id', $user->id)->where('is_default', true)->count())->toBe(1);
});

it('updates its own address', function () {
    seedRoles();
    $user = User::factory()->create();
    $address = $user->addresses()->create([
        'nama_penerima' => 'Budi',
        'no_hp' => '0812-0000-1111',
        'alamat' => 'Jl. Melati No. 12',
        'is_default' => false,
    ]);

    $this->actingAs($user)
        ->put(route('user.addresses.update', $address), [
            'nama_penerima' => 'Budi Editorial',
            'no_hp' => '0812-0000-1111',
            'alamat' => 'Jl. Melati No. 12',
            'is_default' => true,
        ])
        ->assertRedirect(route('user.addresses'));

    expect($address->refresh())->nama_penerima->toBe('Budi Editorial');
    expect($address->is_default)->toBeTrue();
});

it('forbids updating or deleting another user address', function () {
    seedRoles();
    $ownerAddress = User::factory()->create()
        ->addresses()
        ->create([
            'nama_penerima' => 'Budi',
            'no_hp' => '0812-0000-1111',
            'alamat' => 'Jl. Melati No. 12',
        ]);
    $intruder = User::factory()->create();

    $this->actingAs($intruder)
        ->put(route('user.addresses.update', $ownerAddress), [
            'nama_penerima' => 'Hacked',
            'no_hp' => '0812-0000-1111',
            'alamat' => 'Jl. Melati No. 12',
        ])
        ->assertForbidden();

    $this->actingAs($intruder)
        ->delete(route('user.addresses.destroy', $ownerAddress))
        ->assertForbidden();

    expect(Address::find($ownerAddress->id))->not->toBeNull();
});

it('deletes its own address', function () {
    seedRoles();
    $user = User::factory()->create();
    $address = $user->addresses()->create([
        'nama_penerima' => 'Budi',
        'no_hp' => '0812-0000-1111',
        'alamat' => 'Jl. Melati No. 12',
    ]);

    $this->actingAs($user)
        ->delete(route('user.addresses.destroy', $address))
        ->assertRedirect(route('user.addresses'));

    expect(Address::find($address->id))->toBeNull();
});

it('lists the user addresses on the checkout page', function () {
    [$buyer, $produk] = createPayableShop();

    $address = $buyer->addresses()->create([
        'label' => 'Kantor',
        'nama_penerima' => 'Budi',
        'no_hp' => '0812-0000-1111',
        'kota_id' => '152',
        'kota' => 'Jakarta Selatan',
        'alamat' => 'Jl. Melati No. 12',
        'is_default' => true,
    ]);

    $this->actingAs($buyer)
        ->get(route('checkout'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('checkout')
            ->has('addresses')
            ->where('addresses.0.id', $address->id)
            ->where('addresses.0.nama_penerima', 'Budi'));
});

it('creates an order using a saved address as the shipping address', function () {
    [$buyer, $produk] = createPayableShop();

    $this->actingAs($buyer);

    $response = $this->post(route('checkout.store'), [
        'shipping_address' => "Budi\n0812-0000-1111\nJl. Melati No. 12\nJakarta Selatan",
        'payment_method' => 'bank_transfer',
        'shipping_cost' => 0,
        'courier' => '',
        'notes' => null,
    ]);

    $order = Order::where('user_id', $buyer->id)->latest('id')->first();

    $response->assertRedirect(route('orders.show', $order));
    expect($order->shipping_address)->toBe("Budi\n0812-0000-1111\nJl. Melati No. 12\nJakarta Selatan");
});
