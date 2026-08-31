<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    /**
     * A representative demo tenant used for local development and
     * staging. Idempotent: repeated runs update rather than duplicate.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PlanSeeder::class,
        ]);

        $company = Company::updateOrCreate(
            ['slug' => 'demo-toko'],
            [
                'name' => 'Demo Toko',
                'status' => Company::STATUS_ACTIVE,
            ]
        );

        $this->ensureActiveSubscription($company);

        $owner = $this->ensureUser('demo.owner@yopmail.com', 'Owner Demo', 'password');
        $owner->update(['company_id' => $company->id]);
        $owner->role()->syncWithoutDetaching([Role::where('role', 'owner outlet')->firstOrFail()->id]);

        $admin = $this->ensureUser('demo.admin@yopmail.com', 'Admin Demo', 'password');
        $admin->update(['company_id' => $company->id]);
        $admin->role()->syncWithoutDetaching([Role::where('role', 'admin outlet')->firstOrFail()->id]);

        $kasir = $this->ensureUser('demo.kasir@yopmail.com', 'Kasir Demo', 'password');
        $kasir->update(['company_id' => $company->id]);
        $kasir->role()->syncWithoutDetaching([Role::where('role', 'kasir')->firstOrFail()->id]);

        $outlets = $this->ensureOutlets($company);

        foreach ($outlets as $index => $outlet) {
            $owner->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('owner outlet')]]);
            $admin->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('admin outlet')]]);
            $kasir->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('kasir')]]);

            if ($index === 0) {
                $this->seedOutletCatalog($outlet, $owner);
            }
        }

        $this->seedDemoCustomers($company, $outlets[0]);
        $this->seedDemoCoupons($company, $outlets[0]);

        $this->command?->info('Demo data siap.');
    }

    private function ensureActiveSubscription(Company $company): void
    {
        if ($company->subscription()->exists()) {
            return;
        }

        $plan = Plan::where('slug', 'standard')->first()
            ?? Plan::where('is_active', true)->orderBy('price_monthly')->first();

        app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);
    }

    private function ensureUser(string $email, string $name, string $password): User
    {
        return User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'workos_id' => 'demo-'.Str::lower(Str::random(10)),
            ]
        );
    }

    private function ensureOutlets(Company $company): array
    {
        $definitions = [
            ['nama_outlet' => 'Toko Utama', 'kota' => 'Jakarta', 'telp' => '021-555-0100', 'alamat_outlet' => 'Jl. Melati No. 1, Jakarta Pusat'],
            ['nama_outlet' => 'Toko Cabang', 'kota' => 'Bandung', 'telp' => '022-555-0200', 'alamat_outlet' => 'Jl. Mawar No. 22, Bandung'],
        ];

        return collect($definitions)->map(function (array $data) use ($company): Outlet {
            return Outlet::updateOrCreate(
                ['company_id' => $company->id, 'nama_outlet' => $data['nama_outlet']],
                [
                    'slug' => Str::slug($data['nama_outlet']).'-'.Str::lower(Str::random(4)),
                    'kota' => $data['kota'],
                    'telp' => $data['telp'],
                    'alamat_outlet' => $data['alamat_outlet'],
                ]
            );
        })->values()->all();
    }

    private function seedOutletCatalog(Outlet $outlet, User $owner): void
    {
        $catalog = [
            ['nama_produk' => 'Smartphone A12', 'kategori' => 'Handphone & Aksesoris', 'harga' => 2999000, 'harga_beli' => 2500000, 'stok' => 25, 'sku' => 'SM-A12'],
            ['nama_produk' => 'Kaos Polos Premium', 'kategori' => 'Pakaian Pria', 'harga' => 99000, 'harga_beli' => 50000, 'stok' => 150, 'sku' => 'KP-001'],
            ['nama_produk' => 'Sepatu Sneakers', 'kategori' => 'Sepatu Pria', 'harga' => 450000, 'harga_beli' => 300000, 'stok' => 40, 'sku' => 'SNK-01'],
            ['nama_produk' => 'Tas Ransel Urban', 'kategori' => 'Tas Pria', 'harga' => 275000, 'harga_beli' => 180000, 'stok' => 12, 'sku' => 'TR-U1'],
            ['nama_produk' => 'Jam Tangan Analog', 'kategori' => 'Jam Tangan', 'harga' => 850000, 'harga_beli' => 600000, 'stok' => 8, 'sku' => 'JT-AN'],
        ];

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

        $this->command?->info('Katalog outlet "'.$outlet->nama_outlet.'" dibuat.');
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

    private function roleId(string $roleName): int
    {
        return Role::where('role', $roleName)->firstOrFail()->id;
    }
}
