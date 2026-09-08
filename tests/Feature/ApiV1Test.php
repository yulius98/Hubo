<?php

use App\Models\Kategori;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;

function createApiOutlet(User $owner): Outlet
{
    $outlet = createOutlet(['company_id' => null]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');

    return $outlet;
}

function createApiProduk(Outlet $outlet): Produk
{
    $kategori = Kategori::create([
        'id_user' => $outlet->users()->first()->id,
        'kategori' => 'Kategori '.fake()->unique()->word(),
    ]);
    $kategori->outlets()->attach($outlet->id);

    return Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk API '.fake()->unique()->word(),
        'harga_beli' => 5000,
        'margin' => 3000,
        'harga' => 8000,
        'stok' => 20,
        'min_stok' => 3,
    ]);
}

function issueApiToken(User $user, Outlet $outlet, array $scopes = ['produk:read', 'stok:read', 'order:read', 'order:update']): string
{
    $abilities = collect($scopes)->map(fn (string $scope) => "store:{$outlet->id}:{$scope}")->all();

    return $user->createToken('Test', $abilities)->plainTextToken;
}

it('rejects requests without a bearer token', function () {
    $this->getJson('/api/v1/produk')->assertUnauthorized();
});

it('rejects requests with a malformed token', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);

    $this->withHeaders(['Authorization' => 'Bearer nope'])
        ->getJson('/api/v1/produk')
        ->assertUnauthorized();
});

it('allows a valid token to list products of its outlet with pagination', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);
    createApiProduk($outlet);

    $token = issueApiToken($owner, $outlet);

    $this->withToken($token)
        ->getJson('/api/v1/produk?per_page=1')
        ->assertOk()
        ->assertJsonPath('data.0.stok', 20)
        ->assertJsonStructure([
            'data' => [['id', 'nama_produk', 'harga', 'stok', 'min_stok']],
            'links',
            'meta' => ['current_page', 'total', 'per_page'],
        ])
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 2);
});

it('scopes the product detail to the token outlet', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outletA = createApiOutlet($owner);
    $outletB = createApiOutlet($owner);
    $produkA = createApiProduk($outletA);

    $token = issueApiToken($owner, $outletB);

    $this->withToken($token)
        ->getJson("/api/v1/produk/{$produkA->id}")
        ->assertNotFound();
});

it('enforces the required ability scope', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);

    $token = issueApiToken($owner, $outlet, ['produk:read']);

    $this->withToken($token)
        ->getJson('/api/v1/stok')
        ->assertForbidden();
});

it('lists stock levels with the stok scope', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);

    $token = issueApiToken($owner, $outlet, ['stok:read']);

    $this->withToken($token)
        ->getJson('/api/v1/stok')
        ->assertOk()
        ->assertJsonPath('data.0.stok', 20)
        ->assertJsonPath('data.0.status', 'in_stock');
});

it('marks low stock products in the stok endpoint', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);
    $produk = createApiProduk($outlet);
    $produk->forceFill(['stok' => 2])->save();

    $token = issueApiToken($owner, $outlet, ['stok:read']);

    $this->withToken($token)
        ->getJson('/api/v1/stok')
        ->assertOk()
        ->assertJsonFragment(['id' => $produk->id, 'stok' => 2, 'status' => 'low']);
});

it('lists and shows orders scoped to the token outlet', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outletA = createApiOutlet($owner);
    $outletB = createApiOutlet($owner);

    $orderA = Order::forceCreate([
        'order_number' => 'ORD-API-A',
        'user_id' => $owner->id,
        'outlet_id' => $outletA->id,
        'status' => 'paid',
        'subtotal' => 50000,
        'shipping_cost' => 5000,
        'total' => 55000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jl. Tes',
    ]);

    $token = issueApiToken($owner, $outletB, ['order:read']);

    $this->withToken($token)
        ->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonPath('meta.total', 0);

    $this->withToken($token)
        ->getJson("/api/v1/orders/{$orderA->id}")
        ->assertNotFound();
});

it('updates order status and tracking with the order:update scope', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);

    $order = Order::forceCreate([
        'order_number' => 'ORD-API-B',
        'user_id' => $owner->id,
        'outlet_id' => $outlet->id,
        'status' => 'processing',
        'subtotal' => 100000,
        'shipping_cost' => 0,
        'total' => 100000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jl. Tes',
    ]);

    $token = issueApiToken($owner, $outlet, ['order:read', 'order:update']);

    $this->withToken($token)
        ->patchJson("/api/v1/orders/{$order->id}", [
            'status' => 'shipped',
            'tracking_number' => 'RESI-001',
            'courier' => 'JNE',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'shipped')
        ->assertJsonPath('data.tracking_number', 'RESI-001')
        ->assertJsonPath('data.courier', 'JNE');

    expect($order->fresh()->tracking_number)->toBe('RESI-001');
});

it('rejects invalid order status transitions', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);

    $order = Order::forceCreate([
        'order_number' => 'ORD-API-C',
        'user_id' => $owner->id,
        'outlet_id' => $outlet->id,
        'status' => 'completed',
        'subtotal' => 100000,
        'total' => 100000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jl. Tes',
    ]);

    $token = issueApiToken($owner, $outlet, ['order:read', 'order:update']);

    $this->withToken($token)
        ->patchJson("/api/v1/orders/{$order->id}", ['status' => 'bogus'])
        ->assertUnprocessable();
});

it('rate limits API requests per token', function () {
    config(['api.rate_limit_per_minute' => 3]);

    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);
    createApiProduk($outlet);

    $token = issueApiToken($owner, $outlet);

    for ($i = 0; $i < 3; $i++) {
        $this->withToken($token)->getJson('/api/v1/produk')->assertOk();
    }

    $this->withToken($token)
        ->getJson('/api/v1/produk')
        ->assertStatus(429);
});

it('persists and revokes API tokens via the settings UI', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createApiOutlet($owner);

    $this->actingAs($owner)
        ->post(route('api-tokens.store'), [
            'name' => 'POS Toko',
            'outlet_id' => $outlet->id,
            'abilities' => ['produk:read', 'order:read'],
        ])
        ->assertRedirect();

    expect($owner->tokens)->toHaveCount(1);
    expect($owner->tokens->first()->abilities)
        ->toContain("store:{$outlet->id}:produk:read");

    $tokenId = $owner->tokens->first()->id;

    $this->actingAs($owner)
        ->delete(route('api-tokens.destroy'), ['token_id' => $tokenId])
        ->assertRedirect();

    expect($owner->tokens->fresh())->toHaveCount(0);
});

it('prevents creating a token for an outlet the owner does not own', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $otherOutlet = createOutlet();

    $this->actingAs($owner)
        ->post(route('api-tokens.store'), [
            'name' => 'Curang',
            'outlet_id' => $otherOutlet->id,
            'abilities' => ['produk:read'],
        ])
        ->assertForbidden();
});
