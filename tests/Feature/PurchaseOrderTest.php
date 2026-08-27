<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
    $this->company = Company::factory()->create();
    $this->outlet = createOutlet(['company_id' => $this->company->id]);
    $this->supplier = Supplier::factory()->create(['company_id' => $this->company->id]);

    $kategori = Kategori::create([
        'id_user' => $this->admin->id,
        'kategori' => 'Makanan',
    ]);
    $kategori->outlets()->attach($this->outlet->id);

    $this->produk = Produk::create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk PO Test',
        'harga_beli' => 10000,
        'margin' => 25,
        'harga' => 12500,
        'diskon' => 'no',
        'stok' => 10,
    ]);
});

it('allows super admin to list purchase orders', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.purchase-orders'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/purchase-orders'));
});

it('allows super admin to create a purchase order', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.purchase-orders.store'), [
            'supplier_id' => $this->supplier->id,
            'outlet_id' => $this->outlet->id,
            'items' => [
                [
                    'produk_id' => $this->produk->id,
                    'jumlah' => 5,
                    'harga_beli' => 10000,
                ],
            ],
            'expected_date' => now()->addDays(7)->toDateString(),
            'catatan' => 'Test PO',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_orders', [
        'supplier_id' => $this->supplier->id,
        'status' => 'draft',
    ]);
    $this->assertDatabaseHas('po_items', [
        'produk_id' => $this->produk->id,
        'jumlah' => 5,
    ]);
});

it('allows super admin to view purchase order detail', function () {
    $po = PurchaseOrder::factory()->create([
        'company_id' => $this->company->id,
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.purchase-orders.show', $po))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/purchase-order-detail'));
});

it('allows super admin to receive a purchase order', function () {
    $po = PurchaseOrder::factory()->create([
        'company_id' => $this->company->id,
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'draft',
    ]);

    $po->items()->create([
        'produk_id' => $this->produk->id,
        'jumlah' => 5,
        'harga_beli' => 10000,
        'subtotal' => 50000,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.purchase-orders.receive', $po))
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $po->id,
        'status' => 'received',
    ]);

    $this->assertEquals(15, $this->produk->fresh()->stok);
});

it('prevents non-admin from accessing purchase orders', function () {
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)
        ->get(route('admin.purchase-orders'))
        ->assertForbidden();
});
