<?php

use App\Events\LowStockAlert;
use App\Events\OrderCreated;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Produk;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\OrderService;
use App\Services\TenantService;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    seedRoles();
});

it('broadcasts OrderCreated on the tenant private channel with the right payload', function () {
    Event::fake([OrderCreated::class]);

    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Broadcast',
        'harga' => 50000,
        'harga_diskon' => null,
        'stok' => 10,
    ]);

    $buyer = User::factory()->create(['company_id' => $company->id]);
    Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    Event::assertDispatched(OrderCreated::class, function (OrderCreated $event) use ($company, $order) {
        return $event->broadcastOn()[0]->name === 'private-tenant.'.$company->id
            && $event->order->is($order)
            && $event->broadcastWith()['order_number'] === $order->order_number;
    });
});

it('dispatches a LowStockAlert broadcast only for products at or below minimum stock', function () {
    Event::fake([LowStockAlert::class]);

    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori'.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Stok Menipis',
        'stok' => 2,
        'min_stok' => 5,
    ]);

    Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Stok Aman',
        'stok' => 20,
        'min_stok' => 5,
    ]);

    $service = app(NotificationService::class);

    foreach (Produk::all() as $produk) {
        $service->notifyLowStock($produk);
    }

    Event::assertDispatched(LowStockAlert::class, fn (LowStockAlert $event) => $event->produk->nama_produk === 'Stok Menipis');
    Event::assertNotDispatched(LowStockAlert::class, fn (LowStockAlert $event) => $event->produk->nama_produk === 'Stok Aman');
});

it('allows an owner to authenticate for their tenant private channel', function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher' => [
            'driver' => 'pusher',
            'key' => 'test-key',
            'secret' => 'test-secret',
            'app_id' => 'test-app',
            'options' => ['cluster' => 'ap1'],
            'client_options' => [],
        ],
    ]);

    // Re-register the channel on the pusher connection after switching the
    // default broadcaster (at boot it was registered on the 'null' connection).
    Broadcast::channel('tenant.{tenantId}', function ($user, $tenantId) {
        $company = app(TenantService::class)->resolveForUser($user);

        return $company !== null && $company->id === (int) $tenantId;
    });

    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)
        ->post('/broadcasting/auth', [
            'channel_name' => 'private-tenant.'.$company->id,
            'socket_id' => '123456.789012',
        ])
        ->assertOk()
        ->assertJson(fn ($json) => $json->has('auth'));
});

it('rejects users outside the tenant from its private channel', function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher' => [
            'driver' => 'pusher',
            'key' => 'test-key',
            'secret' => 'test-secret',
            'app_id' => 'test-app',
            'options' => ['cluster' => 'ap1'],
            'client_options' => [],
        ],
    ]);

    Broadcast::channel('tenant.{tenantId}', function ($user, $tenantId) {
        $company = app(TenantService::class)->resolveForUser($user);

        return $company !== null && $company->id === (int) $tenantId;
    });

    $outlet = createOutlet();
    $company = $outlet->company;
    $outlier = User::factory()->create();

    $this->actingAs($outlier)
        ->post('/broadcasting/auth', [
            'channel_name' => 'private-tenant.'.$company->id,
            'socket_id' => '123456.789012',
        ])
        ->assertForbidden();
});

it('keeps working without a realtime broadcaster configured', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori'.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Aman',
        'stok' => 10,
        'min_stok' => 0,
    ]);

    $buyer = User::factory()->create(['company_id' => $company->id]);
    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    Event::fake([OrderCreated::class]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    expect($order)->not->toBeNull();
});
