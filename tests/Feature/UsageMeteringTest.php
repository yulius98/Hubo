<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Order;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Models\UsageMetric;
use App\Services\UsageMeteringService;

it('increments a usage metric for the current period', function () {
    $company = Company::factory()->create();

    $service = app(UsageMeteringService::class);
    $service->increment($company, 'orders');
    $service->increment($company, 'orders');
    $service->increment($company, 'orders', 3);

    expect($service->get($company, 'orders'))->toBe(5);
});

it('tracks usage by period', function () {
    $company = Company::factory()->create();

    $service = app(UsageMeteringService::class);
    $service->increment($company, 'orders');
    $service->increment($company, 'orders', when: now()->subMonth());

    expect($service->get($company, 'orders'))->toBe(2);
    expect($service->get($company, 'orders', now()->format('Y-m')))->toBe(1);
    expect($service->get($company, 'orders', now()->subMonth()->format('Y-m')))->toBe(1);
});

it('tracks usage per outlet', function () {
    $company = Company::factory()->create();
    $owner = createUserWithGlobalRole('owner outlet');
    $outletA = createOutlet(['company_id' => $company->id]);
    $outletB = createOutlet(['company_id' => $company->id]);

    $service = app(UsageMeteringService::class);
    $service->increment($company, 'orders', outletId: $outletA->id);
    $service->increment($company, 'orders', outletId: $outletB->id);
    $service->increment($company, 'orders', outletId: $outletB->id);

    expect($service->get($company, 'orders', outletId: $outletA->id))->toBe(1);
    expect($service->get($company, 'orders', outletId: $outletB->id))->toBe(2);
});

it('ignores increments without a company', function () {
    $service = app(UsageMeteringService::class);
    $service->increment(null, 'orders');

    expect(UsageMetric::query()->count())->toBe(0);
});

it('records an order against order and revenue metrics', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create(['id_outlet' => $outlet->id, 'id_kategori' => $kategori->id, 'harga' => 100000]);

    $order = Order::create([
        'order_number' => 'TEST-1',
        'user_id' => $owner->id,
        'outlet_id' => $outlet->id,
        'status' => 'completed',
        'subtotal' => 100000,
        'shipping_cost' => 0,
        'discount' => 0,
        'tax' => 11000,
        'total' => 111000,
        'payment_method' => 'cash',
    ]);

    app(UsageMeteringService::class)->recordOrder($order);

    expect(app(UsageMeteringService::class)->get($company, 'orders'))->toBe(1);
    expect(app(UsageMeteringService::class)->get($company, 'gross_revenue'))->toBe(111000);
});

it('records a POS transaction', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create(['id_outlet' => $outlet->id, 'id_kategori' => $kategori->id]);

    $transaksi = Transaksi::create([
        'tgl_transaksi' => now(),
        'id_user' => $owner->id,
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 1,
        'harga_jual' => 10000,
    ]);

    app(UsageMeteringService::class)->recordTransaction($transaksi);

    expect(app(UsageMeteringService::class)->get($company, 'transactions'))->toBe(1);
});
