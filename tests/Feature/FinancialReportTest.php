<?php

use App\Models\Company;
use App\Models\Expense;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Models\User;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
    $this->company = Company::factory()->create();
    $this->outlet = createOutlet(['company_id' => $this->company->id]);
});

it('allows super admin to view financial reports', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.reports'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/reports'));
});

it('calculates correct financial metrics', function () {
    $kategori = Kategori::create([
        'id_user' => $this->admin->id,
        'kategori' => 'Makanan',
    ]);
    $kategori->outlets()->attach($this->outlet->id);

    Produk::create([
        'id_outlet' => $this->outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Laporan Test',
        'harga_beli' => 10000,
        'margin' => 25,
        'harga' => 12500,
        'diskon' => 'no',
        'stok' => 10,
    ]);

    $produk = Produk::latest()->first();

    Transaksi::create([
        'id_outlet' => $this->outlet->id,
        'id_produk' => $produk->id,
        'id_user' => $this->admin->id,
        'id_kategori' => $kategori->id,
        'jumlah_produk' => 10,
        'harga_jual' => 15000,
        'harga_beli' => 10000,
        'tgl_transaksi' => now()->startOfMonth()->addDays(5)->toDateTimeString(),
        'jenis_transaksi' => 'OUT',
    ]);

    Expense::factory()->create([
        'company_id' => $this->company->id,
        'outlet_id' => $this->outlet->id,
        'jumlah' => 500000,
        'kategori' => 'listrik',
        'tanggal' => now()->startOfMonth()->addDays(5)->toDateString(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('revenue', 150000)
            ->where('cogs', 100000)
            ->where('totalExpenses', 500000)
            ->where('grossProfit', 50000)
            ->where('netProfit', -450000));
});

it('allows super admin to export CSV', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.reports.export'))
        ->assertOk();
});

it('allows super admin to export Excel', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.reports.export-excel'))
        ->assertOk();
});

it('allows super admin to export PDF', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.reports.export-pdf'))
        ->assertOk();
});

it('prevents non-admin from accessing reports', function () {
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)
        ->get(route('admin.reports'))
        ->assertForbidden();
});
