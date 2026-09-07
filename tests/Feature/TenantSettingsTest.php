<?php

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Produk;
use Inertia\Testing\AssertableInertia as Assert;

it('lets an owner update company and outlet settings', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createOutlet();
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $outlet->company_id]);

    $this->actingAs($owner)
        ->get(route('tenant-settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/tenant')
            ->where('company.name', $outlet->company->name));

    $this->actingAs($owner)
        ->put(route('tenant-settings.update'), [
            'name' => 'Toko Baru',
            'slug' => 'toko-baru-settings',
            'logo' => 'storage/companies/logo.webp',
            'alamat_bisnis' => 'Jl. Anggrek No. 2',
            'konfigurasi_pajak_ppn' => '10',
            'ongkir_kota_default' => 'Bandung',
        ])
        ->assertRedirect(route('tenant-settings.index'));

    $company = Company::find($outlet->company_id);

    expect($company->name)->toBe('Toko Baru')
        ->and($company->slug)->toBe('toko-baru-settings')
        ->and(CompanySetting::get($company->id, CompanySetting::KEY_LOGO))->toBe('storage/companies/logo.webp')
        ->and(CompanySetting::get($company->id, CompanySetting::KEY_ADDRESS))->toBe('Jl. Anggrek No. 2')
        ->and(CompanySetting::get($company->id, CompanySetting::KEY_TAX_PERCENT))->toBe('10')
        ->and(CompanySetting::get($company->id, CompanySetting::KEY_DEFAULT_SHIPPING_CITY))->toBe('Bandung');

    $this->actingAs($owner)
        ->put(route('tenant-settings.outlet.update', ['outlet' => $outlet->id]), [
            'nama_outlet' => 'Toko Cabang Baru',
            'slug' => 'toko-cabang-baru',
            'logo' => 'storage/outlets/logo.webp',
            'banner' => 'storage/outlets/banner.webp',
            'jam_buka' => '08.00 - 21.00',
            'mata_uang' => 'IDR',
            'alamat_outlet' => 'Jl. Mawar No. 3',
            'kota' => 'Bandung',
            'telp' => '022-555-0100',
            'alamat_pengiriman_default' => 'Jl. Mawar No. 3',
        ])
        ->assertRedirect(route('tenant-settings.index'));

    $outlet->refresh();

    expect($outlet->nama_outlet)->toBe('Toko Cabang Baru')
        ->and($outlet->logo)->toBe('storage/outlets/logo.webp')
        ->and($outlet->banner)->toBe('storage/outlets/banner.webp')
        ->and($outlet->jam_buka)->toBe('08.00 - 21.00')
        ->and($outlet->mata_uang)->toBe('IDR')
        ->and($outlet->alamat_pengiriman_default)->toBe('Jl. Mawar No. 3');
});

it('denies non-owners from the tenant settings page', function () {
    $admin = createUserWithGlobalRole('admin outlet');
    $outlet = createOutlet();
    attachUserToOutlet($admin, $outlet, 'admin outlet');
    $admin->update(['company_id' => $outlet->company_id]);

    $this->actingAs($admin)
        ->get(route('tenant-settings.index'))
        ->assertForbidden();

    $this->actingAs($admin)
        ->put(route('tenant-settings.update'), [
            'name' => 'Dicuri',
            'slug' => 'dicuri',
            'konfigurasi_pajak_ppn' => '11',
        ])
        ->assertForbidden();

    $company = Company::find($outlet->company_id);

    expect($company->name)->not->toBe('Dicuri');
});

it('applies outlet and company settings to the storefront', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createOutlet([
        'nama_outlet' => 'Toko Sejahtera',
        'slug' => 'toko-sejahtera',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $outlet->company_id]);

    $outlet->update([
        'logo' => 'storage/outlets/logo.webp',
        'banner' => 'storage/outlets/banner.webp',
        'jam_buka' => '08.00 - 21.00',
        'mata_uang' => 'IDR',
    ]);

    CompanySetting::set($outlet->company_id, CompanySetting::KEY_TAX_PERCENT, '10');

    $this->get(route('storefront', ['slug' => 'toko-sejahtera']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet.logo', 'storage/outlets/logo.webp')
            ->where('outlet.banner', 'storage/outlets/banner.webp')
            ->where('outlet.jam_buka', '08.00 - 21.00')
            ->where('outlet.mata_uang', 'IDR')
            ->where('tax_default', '10'));
});

it('uses the outlet default shipping address on checkout', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createOutlet([
        'nama_outlet' => 'Toko Kirim',
        'slug' => 'toko-kirim',
        'alamat_pengiriman_default' => 'Jl. Utara No. 4, Jakarta',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $outlet->company_id]);

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Minuman']);
    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Es Teh',
        'stok' => 10,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $owner->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)
        ->get(route('checkout'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('default_shipping_address', 'Jl. Utara No. 4, Jakarta'));
});
