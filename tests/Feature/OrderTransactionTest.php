<?php

use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaKasir;
use App\Models\KeranjangBelanjaUser;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\OrderService;

function buildShop(Outlet $outlet, User $owner): Kategori
{
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    return $kategori;
}

function createBuyer(Company $company): User
{
    $buyer = User::factory()->create();

    return tap($buyer, fn (User $u) => $u->update(['company_id' => $company->id]));
}

it('creates an order with coupon and loyalty points from the user cart', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = buildShop($outlet, $owner);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Jual',
        'harga' => 500000,
        'harga_diskon' => null,
        'stok' => 10,
    ]);

    $buyer = createBuyer($company);
    $customer = Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
        'points' => 2000,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 2,
        'status' => 'pending',
    ]);

    $coupon = Coupon::factory()->fixed(50000)->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'min_purchase' => 0,
        'valid_from' => now()->subDay(),
        'valid_to' => now()->addMonth(),
    ]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart(
        userId: $buyer->id,
        shippingAddress: 'Jl. Test No. 1',
        paymentMethod: 'bank_transfer',
        couponCode: $coupon->code,
        points: 2000,
    );

    expect($order->subtotal)->toBe('1000000.00');
    expect($order->coupon_code)->toBe($coupon->code);
    expect($order->coupon_discount)->toBe('50000.00');
    expect($order->points_used)->toBe(2000);
    expect($order->points_discount)->toBe('200000.00');
    expect($order->discount)->toBe('250000.00');
    expect($order->tax)->toBe('82500.00');
    expect($order->total)->toBe('832500.00');
    expect($order->customer_id)->toBe($customer->id);
    expect($order->outlet_id)->toBe($outlet->id);

    expect($customer->fresh()->points)->toBe(0);
    expect($coupon->fresh()->used_count)->toBe(1);
    expect($produk->fresh()->stok)->toBe(8);
    expect($order->items()->count())->toBe(1);

    $this->assertDatabaseHas('loyalty_transactions', [
        'customer_id' => $customer->id,
        'type' => 'redeem',
        'points' => -2000,
    ]);
});

it('awards loyalty points when an order is completed', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = buildShop($outlet, $owner);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Jual',
        'harga' => 500000,
        'stok' => 10,
    ]);

    $buyer = createBuyer($company);
    $customer = Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
        'points' => 0,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 2,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');
    expect($order->status)->toBe('awaiting_payment');

    $service = app(OrderService::class);
    $order = $service->transitionStatus($order->fresh(), 'paid');
    $order = $service->transitionStatus($order->fresh(), 'processing');
    $order = $service->transitionStatus($order->fresh(), 'shipped');
    $order = $service->transitionStatus($order->fresh(), 'completed');

    expect($order->status)->toBe('completed');
    expect($customer->fresh()->points)->toBe((int) floor($order->total / LoyaltyService::EARN_FACTOR));

    $this->assertDatabaseHas('loyalty_transactions', [
        'customer_id' => $customer->id,
        'order_id' => $order->id,
        'type' => 'earn',
    ]);
});

it('refunds the redeemed points and restores stock on cancellation', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = buildShop($outlet, $owner);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Jual',
        'harga' => 500000,
        'stok' => 10,
    ]);

    $buyer = createBuyer($company);
    $customer = Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
        'points' => 2000,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $coupon = Coupon::factory()->fixed(10000)->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'min_purchase' => 0,
        'valid_from' => now()->subDay(),
        'valid_to' => now()->addMonth(),
    ]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer', couponCode: $coupon->code, points: 1000);

    expect($customer->fresh()->points)->toBe(1000);

    $order = app(OrderService::class)->transitionStatus($order->fresh(), 'cancelled');

    expect($order->status)->toBe('cancelled');
    expect($customer->fresh()->points)->toBe(2000);
    expect($produk->fresh()->stok)->toBe(10);
    expect($coupon->fresh()->used_count)->toBe(0);
});

it('prefers the variant price and decrements its stock on order', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = buildShop($outlet, $owner);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Varian',
        'harga' => 400000,
        'stok' => 10,
    ]);
    $variant = ProductVariant::factory()->create(['produk_id' => $produk->id, 'nama' => 'XL', 'harga' => 450000, 'stok' => 7]);
    $produk->update(['stok' => 0]);

    $buyer = createBuyer($company);
    Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
        'points' => 0,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'variant_id' => $variant->id,
        'jumlah_produk' => 2,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    $order = app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    $item = $order->items()->first();
    expect((float) $item->price)->toBe(450000.0);
    expect($item->variant_id)->toBe($variant->id);
    expect($item->variant_name)->toBe('XL');
    expect($variant->fresh()->stok)->toBe(5);
});

it('finalizes the cashier cart into a completed order', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $kategori = buildShop($outlet, $kasir);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Kasir',
        'harga' => 100000,
        'stok' => 10,
    ]);

    $customer = Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'name' => 'Walk In',
        'email' => 'walkin@example.com',
        'points' => 0,
    ]);

    KeranjangBelanjaKasir::create([
        'id_user' => $kasir->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'customer_id' => $customer->id,
        'jumlah_produk' => 3,
        'status' => 'pending',
    ]);

    $this->withSession(['selected_outlet_id' => $outlet->id])
        ->actingAs($kasir)
        ->post(route('cashier.cart.finalize'))
        ->assertRedirect();

    $order = Order::latest('id')->first();

    expect($order->status)->toBe('completed');
    expect($order->customer_id)->toBe($customer->id);
    expect($order->outlet_id)->toBe($outlet->id);
    expect($order->subtotal)->toBe('300000.00');
    expect($produk->fresh()->stok)->toBe(7);
    expect(KeranjangBelanjaKasir::where('status', 'pending')->count())->toBe(0);

    $this->assertDatabaseHas('loyalty_transactions', [
        'customer_id' => $customer->id,
        'order_id' => $order->id,
        'type' => 'earn',
    ]);
});
