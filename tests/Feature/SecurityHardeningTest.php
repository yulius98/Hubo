<?php

use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Produk;
use App\Models\RequestRole;
use App\Models\User;
use App\Services\OrderService;
use App\Services\ShippingService;
use Inertia\Testing\AssertableInertia as Assert;

function createReturnOrderFixture(): array
{
    $admin = createUserWithGlobalRole('super admin');
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);

    $kategori = Kategori::create(['id_user' => $admin->id, 'kategori' => 'Kategori '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Retur',
        'harga_beli' => 10000,
        'margin' => 25,
        'harga' => 12500,
        'diskon' => 'no',
        'stok' => 10,
    ]);

    $outlet->users()->attach($user->id, ['role_id' => roleId('user')]);

    $order = Order::create([
        'order_number' => 'ORD-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => $user->id,
        'outlet_id' => $outlet->id,
        'status' => 'completed',
        'subtotal' => 15000,
        'total' => 15000,
        'shipping_address' => 'Jl. Test No. 1',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'produk_id' => $produk->id,
        'product_name' => 'Produk Retur',
        'price' => 15000,
        'quantity' => 1,
        'subtotal' => 15000,
    ]);

    return compact('user', 'order');
}

it('forbids viewing another users return detail', function () {
    $fixture = createReturnOrderFixture();
    $user = $fixture['user'];
    $order = $fixture['order'];
    $attacker = User::factory()->create();

    $return = OrderReturn::create([
        'company_id' => $order->outlet->company_id,
        'order_id' => $order->id,
        'return_number' => 'RET-'.fake()->unique()->numberBetween(1000, 9999),
        'reason' => 'Produk rusak',
        'status' => 'pending',
        'refund_amount' => 15000,
    ]);

    $this->actingAs($user)
        ->get(route('returns.show', $return))
        ->assertOk();

    $this->actingAs($attacker)
        ->get(route('returns.show', $return))
        ->assertForbidden();
});

it('ignores forged user_id and status when a staff request is submitted', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $plainUser = User::factory()->create();
    $victim = User::factory()->create();

    $this->actingAs($plainUser)
        ->post(route('req_staff.add'), [
            'user_id' => $victim->id,
            'owner_id' => $owner->id,
            'role_id' => roleId('kasir'),
            'outlet_id' => $outlet->id,
            'status' => 'done',
        ])
        ->assertSessionHasNoErrors();

    $request = RequestRole::where('outlet_id', $outlet->id)->first();

    expect($request)->not->toBeNull();
    expect($request->user_id)->toBe($plainUser->id);
    expect($request->owner_id)->toBe($owner->id);
    expect($request->status)->toBe('pending');
});

it('rejects a customer from another company at the cashier', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $outletA = createOutlet(['company_id' => $companyA->id]);
    $outletB = createOutlet(['company_id' => $companyB->id]);
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');

    $kategori = Kategori::create(['id_user' => $kasir->id, 'kategori' => 'Kasir '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outletA->id);

    $produk = Produk::create([
        'id_outlet' => $outletA->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Outlet A',
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'diskon' => 'no',
        'stok' => 5,
    ]);

    $outsider = Customer::factory()->create([
        'company_id' => $companyB->id,
        'outlet_id' => $outletB->id,
    ]);

    $this->actingAs($kasir)
        ->from(route('cashier'))
        ->post(route('cashier.cart.add'), [
            'id_produk' => $produk->id,
            'id_kategori' => $produk->id_kategori,
            'jumlah_produk' => 1,
            'customer_id' => $outsider->id,
        ])
        ->assertSessionHasErrors('customer_id');

    $this->assertDatabaseCount('keranjang_belanja_kasirs', 0);
});

it('restores coupon usage when an order expires', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $buyer = User::factory()->create();

    $coupon = Coupon::factory()->fixed(10000)->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'usage_limit' => 10,
        'used_count' => 1,
    ]);

    $order = Order::create([
        'order_number' => 'ORD-EXP-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => $buyer->id,
        'outlet_id' => $outlet->id,
        'status' => 'awaiting_payment',
        'subtotal' => 100000,
        'coupon_id' => $coupon->id,
        'coupon_code' => $coupon->code,
        'coupon_discount' => 10000,
        'total' => 90000,
    ]);

    app(OrderService::class)->transitionStatus($order, 'expired');

    expect($coupon->fresh()->used_count)->toBe(0);
});

it('rejects a tampered shipping cost at checkout', function () {
    $this->mock(ShippingService::class, function ($mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true);
        $mock->shouldReceive('calculateCost')->andReturn([
            'costs' => [['service' => 'REG', 'cost' => [['value' => 30000]]]],
            'error' => null,
        ]);
    });

    $buyer = User::factory()->create();

    $this->actingAs($buyer)
        ->from(route('checkout'))
        ->post(route('checkout.store'), [
            'shipping_address' => 'Jl. Contoh No. 5',
            'payment_method' => 'bank_transfer',
            'shipping_cost' => 1000,
            'courier' => 'REG',
            'shipping_courier_code' => 'jne',
            'shipping_destination_city_id' => '152',
        ])
        ->assertSessionHasErrors('shipping_cost');
});

it('accepts a verified shipping cost at checkout', function () {
    $this->mock(ShippingService::class, function ($mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true);
        $mock->shouldReceive('calculateCost')->andReturn([
            'costs' => [['service' => 'REG', 'cost' => [['value' => 30000]]]],
            'error' => null,
        ]);
    });

    $company = Company::factory()->create();
    $buyer = User::factory()->create(['company_id' => $company->id]);

    $outlet = createOutlet(['company_id' => $company->id]);
    $outlet->users()->attach($buyer->id, ['role_id' => roleId('user')]);

    $kategori = Kategori::create(['id_user' => $buyer->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Belanja',
        'harga_beli' => 8000,
        'margin' => 25,
        'harga' => 11100,
        'diskon' => 'no',
        'stok' => 5,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    session(['selected_outlet_id' => $outlet->id]);

    $response = $this->actingAs($buyer)
        ->from(route('checkout'))
        ->post(route('checkout.store'), [
            'shipping_address' => 'Jl. Contoh No. 5',
            'payment_method' => 'bank_transfer',
            'shipping_cost' => 30000,
            'courier' => 'REG',
            'shipping_courier_code' => 'jne',
            'shipping_destination_city_id' => '152',
        ]);

    $response->assertSessionHasNoErrors();

    $response->assertRedirect();
});

it('rejects xendit webhooks when the callback token is missing', function () {
    $this->postJson(route('webhooks.xendit'), [])
        ->assertUnauthorized();
});

it('rejects midtrans webhooks without a valid signature', function () {
    $this->postJson(route('webhooks.midtrans'), [
        'order_id' => 'ORD-1',
        'status_code' => '200',
        'gross_amount' => '10000',
        'signature_key' => 'invalid',
    ])->assertUnauthorized();
});

it('scopes the staff request outlets to safe columns', function () {
    $plainUser = User::factory()->create();
    $outlet = createOutlet();

    $this->actingAs($plainUser)
        ->get(route('req_staff'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/request_menjadi_staff')
            ->has('outlets', 1)
            ->where('outlets.0.id', $outlet->id)
            ->where('outlets.0.nama_outlet', $outlet->nama_outlet)
        );
});
