<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    /**
     * Seed a representative demo tenant (company, subscription, staff and
     * outlets). Idempotent: repeated runs update rather than duplicate.
     */
    public function run(): void
    {
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
        $owner->role()->syncWithoutDetaching([$this->roleId('owner outlet')]);

        $admin = $this->ensureUser('demo.admin@yopmail.com', 'Admin Demo', 'password');
        $admin->update(['company_id' => $company->id]);
        $admin->role()->syncWithoutDetaching([$this->roleId('admin outlet')]);

        $kasir = $this->ensureUser('demo.kasir@yopmail.com', 'Kasir Demo', 'password');
        $kasir->update(['company_id' => $company->id]);
        $kasir->role()->syncWithoutDetaching([$this->roleId('kasir')]);

        $outlets = $this->ensureOutlets($company);

        foreach ($outlets as $index => $outlet) {
            $owner->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('owner outlet')]]);
            $admin->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('admin outlet')]]);
            $kasir->outlets()->syncWithoutDetaching([$outlet->id => ['role_id' => $this->roleId('kasir')]]);
        }
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
                'workos_id' => 'demo-'.md5($email),
            ]
        );
    }

    /**
     * @return list<Outlet>
     */
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

    private function roleId(string $roleName): int
    {
        return Role::where('role', $roleName)->firstOrFail()->id;
    }
}
