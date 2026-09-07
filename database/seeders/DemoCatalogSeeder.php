<?php

namespace Database\Seeders;

use App\Jobs\SeedDemoCatalog;
use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoCatalogSeeder extends Seeder
{
    /**
     * Seed a representative catalog for the demo tenant's first outlet
     * (categories, products with SKUs, variants, stock, customers and
     * coupons). Idempotent: repeated runs update rather than duplicate.
     */
    public function run(): void
    {
        $company = Company::where('slug', 'demo-toko')->firstOrFail();

        $owner = User::where('email', 'demo.owner@yopmail.com')->firstOrFail();

        $outlet = $company->outlets()->orderBy('id')->firstOrFail();

        $catalog = $this->catalogItems();

        if (count($catalog) >= (int) config('seed.bulk_threshold', 50)) {
            SeedDemoCatalog::dispatch($company->id, $owner->id, $outlet->id, $catalog);

            $this->command?->info('Katalog demo yang sangat besar dijadwalkan ke antrian.');

            return;
        }

        foreach ($catalog as $item) {
            $kategori = $this->resolveCategory($item['kategori'], $owner, $outlet);

            $produk = Produk::updateOrCreate(
                ['id_outlet' => $outlet->id, 'sku' => $item['sku']],
                [
                    'id_kategori' => $kategori->id,
                    'nama_produk' => $item['nama_produk'],
                    'keterangan' => 'Produk demo untuk pengembangan.',
                    'harga_beli' => $item['harga_beli'],
                    'margin' => round((($item['harga'] - $item['harga_beli']) / $item['harga_beli']) * 100, 2),
                    'harga' => $item['harga'],
                    'ppn' => 11,
                    'tax' => 'include tax',
                    'diskon' => 'no',
                    'harga_diskon' => null,
                    'stok' => $item['stok'],
                    'min_stok' => 5,
                ]
            );

            ProductVariant::updateOrCreate(
                ['produk_id' => $produk->id, 'nama' => 'Standar'],
                ['sku' => $item['sku'].'-S', 'harga' => $item['harga'], 'stok' => $item['stok'], 'is_active' => true]
            );
        }

        $this->seedDemoCustomers($company, $outlet);
        $this->seedDemoCoupons($company, $outlet);

        $this->command?->info('Katalog demo untuk "'.$outlet->nama_outlet.'" siap.');
    }

    /**
     * The demo catalog product definitions.
     *
     * @return array<int, array<string, mixed>>
     */
    private function catalogItems(): array
    {
        return [
            ['nama_produk' => 'Smartphone A12', 'kategori' => 'Handphone & Aksesoris', 'harga' => 2999000, 'harga_beli' => 2500000, 'stok' => 25, 'sku' => 'SM-A12'],
            ['nama_produk' => 'Kaos Polos Premium', 'kategori' => 'Pakaian Pria', 'harga' => 99000, 'harga_beli' => 50000, 'stok' => 150, 'sku' => 'KP-001'],
            ['nama_produk' => 'Sepatu Sneakers', 'kategori' => 'Sepatu Pria', 'harga' => 450000, 'harga_beli' => 300000, 'stok' => 40, 'sku' => 'SNK-01'],
            ['nama_produk' => 'Tas Ransel Urban', 'kategori' => 'Tas Pria', 'harga' => 275000, 'harga_beli' => 180000, 'stok' => 12, 'sku' => 'TR-U1'],
            ['nama_produk' => 'Jam Tangan Analog', 'kategori' => 'Jam Tangan', 'harga' => 850000, 'harga_beli' => 600000, 'stok' => 8, 'sku' => 'JT-AN'],
        ];
    }

    private function resolveCategory(string $name, User $owner, Outlet $outlet): Kategori
    {
        $kategori = Kategori::firstOrCreate(
            ['id_user' => $owner->id, 'kategori' => $name],
            ['gambar' => 'storage/kategoris/'.Str::slug($name).'.webp']
        );

        $kategori->outlets()->syncWithoutDetaching([$outlet->id]);

        return $kategori;
    }

    private function seedDemoCustomers(Company $company, Outlet $outlet): void
    {
        $customers = [
            ['name' => 'Budi Santoso', 'email' => 'budi@example.com', 'phone' => '0812-0000-0001'],
            ['name' => 'Siti Rahayu', 'email' => 'siti@example.com', 'phone' => '0812-0000-0002'],
            ['name' => 'Agus Widodo', 'email' => 'agus@example.com', 'phone' => '0812-0000-0003'],
        ];

        foreach ($customers as $data) {
            Customer::updateOrCreate(
                ['company_id' => $company->id, 'email' => $data['email']],
                [
                    'outlet_id' => $outlet->id,
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'address' => 'Jl. Contoh No. 9, Jakarta',
                ]
            );
        }
    }

    private function seedDemoCoupons(Company $company, Outlet $outlet): void
    {
        $coupons = [
            ['code' => 'HEMAT10', 'name' => 'Diskon 10%', 'type' => 'percentage', 'value' => 10, 'min_purchase' => 100000, 'usage_limit' => 100],
            ['code' => 'GRATIS15K', 'name' => 'Potongan Rp15.000', 'type' => 'fixed', 'value' => 15000, 'min_purchase' => 50000, 'usage_limit' => 50],
        ];

        foreach ($coupons as $data) {
            Coupon::updateOrCreate(
                ['company_id' => $company->id, 'code' => $data['code']],
                [
                    'outlet_id' => $outlet->id,
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'value' => $data['value'],
                    'min_purchase' => $data['min_purchase'],
                    'usage_limit' => $data['usage_limit'],
                    'is_active' => true,
                ]
            );
        }
    }
}
