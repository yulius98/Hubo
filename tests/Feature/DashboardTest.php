<?php

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createTransaksi(User $user, Outlet $outlet, string $jenis = 'IN', int $jumlah = 1): Transaksi
{
    $kategori = Kategori::create([
        'id_user' => $user->id,
        'id_outlet' => $outlet->id,
        'kategori' => 'Minuman '.fake()->unique()->word(),
    ]);

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk '.fake()->unique()->word(),
        'harga' => 10000,
    ]);

    return Transaksi::create([
        'tgl_transaksi' => now(),
        'id_user' => $user->id,
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jenis_transaksi' => $jenis,
        'jumlah_produk' => $jumlah,
    ]);
}

it('renders the dashboard component', function () {
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), createOutlet(), 'owner outlet');

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('akun_users/dashboard'));
});

it('owner only sees transactions from their own outlets', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $ownerA = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $ownerB = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletB, 'owner outlet');

    createTransaksi($ownerA, $outletA);
    createTransaksi($ownerB, $outletB);

    $this->actingAs($ownerA)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 1)
            ->where('outletLabel', 'Outlet A')
        );
});

it('owner with multiple outlets sees aggregate and per-outlet breakdown', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = createUserWithGlobalRole('owner outlet');
    attachUserToOutlet($owner, $outletA, 'owner outlet');
    attachUserToOutlet($owner, $outletB, 'owner outlet');

    createTransaksi($owner, $outletA);
    createTransaksi($owner, $outletB);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 2)
            ->where('outletLabel', 'Semua Outlet')
            ->where('selectedOutletId', null)
            ->where('perOutlet', fn ($value) => count($value) === 2)
        );
});

it('owner can filter dashboard to a selected outlet', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = createUserWithGlobalRole('owner outlet');
    attachUserToOutlet($owner, $outletA, 'owner outlet');
    attachUserToOutlet($owner, $outletB, 'owner outlet');

    createTransaksi($owner, $outletA);
    createTransaksi($owner, $outletB);

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 1)
            ->where('outletLabel', 'Outlet A')
            ->where('selectedOutletId', $outletA->id)
        );
});

it('owner cannot see transactions from an outlet they do not own', function () {
    $ownedOutlet = createOutlet(['nama_outlet' => 'Outlet Milik Saya']);
    $otherOutlet = createOutlet(['nama_outlet' => 'Outlet Orang Lain']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    createTransaksi($owner, $ownedOutlet);
    createTransaksi($otherOwner, $otherOutlet);

    session(['selected_outlet_id' => $otherOutlet->id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 1)
            ->where('outletLabel', 'Outlet Milik Saya')
        );
});

it('admin only sees transactions from assigned outlets', function () {
    $ownedOutlet = createOutlet(['nama_outlet' => 'Outlet Admin']);
    $otherOutlet = createOutlet(['nama_outlet' => 'Outlet Lain']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $ownedOutlet, 'admin outlet');

    createTransaksi($owner, $ownedOutlet);
    createTransaksi($otherOwner, $otherOutlet);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 1)
            ->where('outletLabel', 'Outlet Admin')
        );
});

it('kasir only sees transactions from their own outlet', function () {
    $outletKasir = createOutlet(['nama_outlet' => 'Outlet Kasir']);
    $outletLain = createOutlet(['nama_outlet' => 'Outlet Lain']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletKasir, 'owner outlet');
    $ownerLain = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletLain, 'owner outlet');

    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletKasir, 'kasir');

    createTransaksi($owner, $outletKasir, 'OUT', 3);
    createTransaksi($ownerLain, $outletLain);

    $this->actingAs($kasir)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 1)
            ->where('stats.totalOut', 1)
            ->where('stats.jumlahOut', 3)
            ->where('outletLabel', 'Outlet Kasir')
        );
});

it('plain user without outlet sees zero stats', function () {
    $outlet = createOutlet(['nama_outlet' => 'Outlet Lain']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    createTransaksi($owner, $outlet);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalTransaksi', 0)
            ->where('recentTransaksis', [])
        );
});
