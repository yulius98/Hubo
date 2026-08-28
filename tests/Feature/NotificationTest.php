<?php

use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Order;
use App\Models\Produk;
use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Notifications\NewOrderNotification;
use App\Services\NotificationService;
use App\Services\OrderService;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->outlet = createOutlet();
    $this->company = $this->outlet->company;

    $this->admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $this->outlet, 'admin outlet');
    $this->owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $this->outlet, 'owner outlet');

    $this->kategori = Kategori::create(['id_user' => $this->owner->id, 'kategori' => 'Notif '.fake()->unique()->word()]);
    $this->kategori->outlets()->attach($this->outlet->id);
});

it('stores a database notification for company staff when an order is created', function () {
    Notification::fake();

    $produk = Produk::factory()->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Notif',
        'harga' => 100000,
        'stok' => 5,
    ]);

    $buyer = User::factory()->create(['company_id' => $this->company->id]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $this->kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    Notification::assertSentTo($this->owner, NewOrderNotification::class);
    Notification::assertSentTo($this->admin, NewOrderNotification::class);
});

it('creates a low stock notification when stock is below threshold', function () {
    Notification::fake();

    $produk = Produk::factory()->lowStock(5)->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Menipis',
        'stok' => 2,
        'min_stok' => 5,
    ]);

    app(NotificationService::class)->notifyLowStock($produk);

    Notification::assertSentTo($this->owner, LowStockNotification::class);
    Notification::assertSentTo($this->admin, LowStockNotification::class);
});

it('does not create a low stock notification above the threshold', function () {
    Notification::fake();

    $produk = Produk::factory()->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'nama_produk' => 'Produk Aman',
        'stok' => 10,
        'min_stok' => 5,
    ]);

    app(NotificationService::class)->notifyLowStock($produk);

    Notification::assertNotSentTo($this->owner, LowStockNotification::class);
});

it('lists only currently low stock products', function () {
    Produk::factory()->lowStock(3)->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'stok' => 0,
        'min_stok' => 3,
    ]);
    Produk::factory()->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'stok' => 20,
        'min_stok' => 3,
    ]);

    $low = app(NotificationService::class)->lowStockProducts($this->company);

    expect($low->count())->toBe(1);
});

it('renders the notification center and marks notifications as read', function () {
    $this->owner->notify(new NewOrderNotification(createDummyOrder($this->owner->id)));

    $this->actingAs($this->owner)
        ->get(route('notifications'))
        ->assertOk();

    $notificationId = $this->owner->notifications()->first()->id;

    $this->actingAs($this->owner)
        ->post(route('notifications.read', $notificationId))
        ->assertRedirect();

    expect($this->owner->unreadNotifications->count())->toBe(0);
});

it('marks all notifications as read', function () {
    $this->owner->notify(new NewOrderNotification(createDummyOrder($this->owner->id)));
    $this->owner->notify(new LowStockNotification(Produk::factory()->create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $this->kategori->id,
        'stok' => 1,
        'min_stok' => 5,
    ])));

    $this->actingAs($this->owner)
        ->post(route('notifications.read-all'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($this->owner->unreadNotifications()->count())->toBe(0);
});

it('returns the unread count endpoint', function () {
    $this->owner->notify(new NewOrderNotification(createDummyOrder($this->owner->id)));

    $this->actingAs($this->owner)
        ->getJson(route('notifications.unread-count'))
        ->assertOk()
        ->assertJson(['unread_count' => 1]);
});

function createDummyOrder(int $userId): Order
{
    return Order::create([
        'order_number' => 'ORD-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => $userId,
        'status' => 'awaiting_payment',
        'subtotal' => 100000,
        'shipping_cost' => 0,
        'discount' => 0,
        'tax' => 11000,
        'total' => 111000,
        'payment_method' => 'bank_transfer',
    ]);
}
