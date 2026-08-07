<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createDashboardProduk(User $user, Outlet $outlet, array $overrides = []): Produk
{
    $kategori = Kategori::create([
        'id_user' => $user->id,
        'kategori' => 'Minuman '.fake()->unique()->word(),
    ]);
    $kategori->outlets()->attach($outlet->id);

    return Produk::create(array_merge([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk '.fake()->unique()->word(),
        'harga_beli' => 8000,
        'margin' => 2000,
        'harga' => 10000,
    ], $overrides));
}

function createDashboardTransaksi(User $user, Outlet $outlet, Produk $produk, array $overrides = []): Transaksi
{
    return Transaksi::create(array_merge([
        'tgl_transaksi' => now(),
        'id_user' => $user->id,
        'id_outlet' => $outlet->id,
        'id_kategori' => $produk->id_kategori,
        'id_produk' => $produk->id,
        'jenis_transaksi' => 'IN',
        'jumlah_produk' => 1,
    ], $overrides));
}

it('renders an empty state when no outlet is selected', function () {
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), createOutlet(), 'owner outlet');

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/dashboard')
            ->where('outlet', null)
            ->where('role', null)
            ->where('emptyState.title', 'Pilih Outlet Terlebih Dahulu')
        );
});

it('renders an empty state when the selected outlet is not accessible', function () {
    $ownedOutlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');

    session(['selected_outlet_id' => $otherOutlet->id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet', null)
            ->where('emptyState.title', 'Pilih Outlet Terlebih Dahulu')
        );
});

it('shows transactions, products sold and omset stats to the owner', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createDashboardProduk($owner, $outlet, ['harga' => 10000]);

    createDashboardTransaksi($owner, $outlet, $produk, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 2]);
    createDashboardTransaksi($owner, $outlet, $produk, ['jenis_transaksi' => 'IN', 'jumlah_produk' => 5]);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('role', 'owner outlet')
            ->where('periode', 'harian')
            ->where('statistik.transaksi.total', 2)
            ->where('statistik.produk_terjual.total', 2)
            ->where('statistik.omset.total', 20000)
        );
});

it('filters the owner stats by the requested month', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $produk = createDashboardProduk($owner, $outlet, ['harga' => 10000]);

    createDashboardTransaksi($owner, $outlet, $produk, [
        'tgl_transaksi' => '2026-07-05 10:00:00',
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 1,
    ]);
    createDashboardTransaksi($owner, $outlet, $produk, [
        'tgl_transaksi' => '2026-07-20 14:00:00',
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 3,
    ]);
    createDashboardTransaksi($owner, $outlet, $produk, [
        'tgl_transaksi' => '2026-06-15 10:00:00',
        'jenis_transaksi' => 'OUT',
        'jumlah_produk' => 9,
    ]);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('dashboard', ['periode' => 'bulanan', 'tanggal' => '2026-07']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'bulanan')
            ->where('statistik.transaksi.total', 2)
            ->where('statistik.produk_terjual.total', 4)
            ->where('statistik.omset.total', 40000)
            ->where('statistik.produk_terjual.data.4', 1)
            ->where('statistik.produk_terjual.data.19', 3)
            ->where('statistik.produk_terjual.data.5', 0)
        );
});

it('shows employee data, product rankings and recent transactions to the owner', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    attachUserToOutlet(User::factory()->create(['name' => 'Sari Admin']), $outlet, 'admin outlet');
    attachUserToOutlet(User::factory()->create(['name' => 'Budi Kasir']), $outlet, 'kasir');

    $produkLaku = createDashboardProduk($owner, $outlet, ['nama_produk' => 'Kopi Susu']);
    $produkSedang = createDashboardProduk($owner, $outlet, ['nama_produk' => 'Es Teh']);
    $produkSepi = createDashboardProduk($owner, $outlet, ['nama_produk' => 'Roti Bakar']);

    createDashboardTransaksi($owner, $outlet, $produkLaku, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 10]);
    createDashboardTransaksi($owner, $outlet, $produkLaku, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 10]);
    createDashboardTransaksi($owner, $outlet, $produkSedang, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 3]);
    createDashboardTransaksi($owner, $outlet, $produkSepi, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 1]);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('karyawan', 3)
            ->where('karyawan.0.role', 'owner outlet')
            ->where('karyawan.1.role', 'admin outlet')
            ->where('topProduk.0.nama_produk', 'Kopi Susu')
            ->where('topProduk.0.total_terjual', 20)
            ->where('topProduk.1.nama_produk', 'Es Teh')
            ->where('kurangLaku.0.nama_produk', 'Roti Bakar')
            ->where('kurangLaku.0.total_terjual', 1)
            ->has('recentTransaksis', 4)
        );
});

it('shows transaction and product stats and recent transactions to the admin', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $produk = createDashboardProduk($owner, $outlet, ['harga' => 10000]);

    createDashboardTransaksi($owner, $outlet, $produk, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 2]);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('role', 'admin outlet')
            ->where('statistik.transaksi.total', 1)
            ->where('statistik.produk_terjual.total', 2)
            ->where('karyawan', [])
            ->where('topProduk', [])
            ->where('kurangLaku', [])
            ->has('recentTransaksis', 1)
        );
});

it('limits the kasir to their own transactions', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $produk = createDashboardProduk($owner, $outlet, ['harga' => 10000]);

    createDashboardTransaksi($owner, $outlet, $produk, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 5]);
    createDashboardTransaksi($kasir, $outlet, $produk, ['jenis_transaksi' => 'OUT', 'jumlah_produk' => 2]);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($kasir)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('role', 'kasir')
            ->where('statistik.transaksi.total', 1)
            ->where('statistik.produk_terjual.total', 2)
            ->where('statistik.omset.total', 20000)
            ->where('recentTransaksis', [])
            ->where('karyawan', [])
        );
});

it('renders an empty state for a role without dashboard access', function () {
    $outlet = createOutlet();
    $user = attachUserToOutlet(User::factory()->create(), $outlet, 'user');

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet', null)
            ->where('emptyState.title', 'Akses Dashboard Ditolak')
        );
});
