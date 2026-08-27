<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Produk;
use App\Models\User;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
    $this->user = User::factory()->create();

    $this->company = Company::factory()->create();
    $this->outlet = createOutlet(['company_id' => $this->company->id]);

    $kategori = Kategori::create([
        'id_user' => $this->admin->id,
        'kategori' => 'Makanan',
    ]);
    $kategori->outlets()->attach($this->outlet->id);

    $this->produk = Produk::create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Retur Test',
        'harga_beli' => 10000,
        'margin' => 25,
        'harga' => 12500,
        'diskon' => 'no',
        'stok' => 10,
    ]);

    $this->outlet->users()->attach($this->user->id, ['role_id' => roleId('user')]);

    $this->order = Order::create([
        'order_number' => 'ORD-TEST-001',
        'user_id' => $this->user->id,
        'outlet_id' => $this->outlet->id,
        'status' => 'completed',
        'subtotal' => 15000,
        'total' => 15000,
        'shipping_address' => 'Jl. Test No. 1',
    ]);

    $this->orderItem = OrderItem::create([
        'order_id' => $this->order->id,
        'produk_id' => $this->produk->id,
        'product_name' => 'Produk Retur Test',
        'price' => 15000,
        'quantity' => 1,
        'subtotal' => 15000,
    ]);
});

it('allows user to view returns list', function () {
    $this->actingAs($this->user)
        ->get(route('returns'))
        ->assertOk();
});

it('allows user to create a return request', function () {
    $this->actingAs($this->user)
        ->post(route('returns.store'), [
            'order_id' => $this->order->id,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'produk_id' => $this->produk->id,
                    'quantity' => 1,
                    'reason' => 'Produk rusak',
                ],
            ],
            'reason' => 'Produk diterima dalam kondisi rusak',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('returns', [
        'order_id' => $this->order->id,
        'status' => 'pending',
    ]);
});

it('prevents user from returning a pending order', function () {
    $pendingOrder = Order::create([
        'order_number' => 'ORD-TEST-002',
        'user_id' => $this->user->id,
        'outlet_id' => $this->outlet->id,
        'status' => 'pending',
        'subtotal' => 15000,
        'total' => 15000,
        'shipping_address' => 'Jl. Test No. 1',
    ]);

    $pendingItem = OrderItem::create([
        'order_id' => $pendingOrder->id,
        'produk_id' => $this->produk->id,
        'product_name' => 'Produk Retur Test',
        'price' => 15000,
        'quantity' => 1,
        'subtotal' => 15000,
    ]);

    $this->actingAs($this->user)
        ->post(route('returns.store'), [
            'order_id' => $pendingOrder->id,
            'items' => [
                [
                    'order_item_id' => $pendingItem->id,
                    'produk_id' => $this->produk->id,
                    'quantity' => 1,
                    'reason' => 'Tidak suka',
                ],
            ],
            'reason' => 'Ubah pikiran',
        ]);

    $this->assertDatabaseMissing('returns', [
        'order_id' => $pendingOrder->id,
    ]);
});

it('allows order owner to approve a return', function () {
    $return = OrderReturn::create([
        'company_id' => $this->company->id,
        'order_id' => $this->order->id,
        'return_number' => 'RET-001',
        'reason' => 'Produk rusak',
        'status' => 'pending',
        'refund_amount' => 15000,
    ]);

    $this->actingAs($this->user)
        ->post(route('returns.approve', $return))
        ->assertRedirect();

    $this->assertDatabaseHas('returns', [
        'id' => $return->id,
        'status' => 'approved',
    ]);
});

it('allows order owner to reject a return', function () {
    $return = OrderReturn::create([
        'company_id' => $this->company->id,
        'order_id' => $this->order->id,
        'return_number' => 'RET-002',
        'reason' => 'Produk rusak',
        'status' => 'pending',
        'refund_amount' => 0,
    ]);

    $this->actingAs($this->user)
        ->post(route('returns.reject', $return))
        ->assertRedirect();

    $this->assertDatabaseHas('returns', [
        'id' => $return->id,
        'status' => 'rejected',
    ]);
});
