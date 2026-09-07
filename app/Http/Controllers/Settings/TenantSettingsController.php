<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateCompanySettingRequest;
use App\Http\Requests\Settings\UpdateOutletSettingRequest;
use App\Models\CompanySetting;
use App\Models\Outlet;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantSettingsController extends Controller
{
    public const DEFAULTS = [
        'ppn' => '11',
        'kota_default' => '',
    ];

    public function __construct(protected TenantService $tenants) {}

    /**
     * Show the tenant and outlet settings page.
     */
    public function index(Request $request): Response
    {
        $company = $this->tenants->resolveForUser($request->user());

        if ($company === null) {
            abort(404, 'Usaha belum ditemukan.');
        }

        return Inertia::render('settings/tenant', [
            'company' => $company->only('id', 'name', 'slug', 'status'),
            'settings' => $this->settingsPayload($company->id),
            'outlets' => $company->outlets()
                ->get([
                    'id',
                    'nama_outlet',
                    'slug',
                    'logo',
                    'banner',
                    'jam_buka',
                    'mata_uang',
                    'alamat_outlet',
                    'kota',
                    'telp',
                    'alamat_pengiriman_default',
                ])
                ->values(),
            'defaults' => self::DEFAULTS,
        ]);
    }

    /**
     * Update company-level settings (name, slug, logo, address, tax, shipping).
     */
    public function updateCompany(UpdateCompanySettingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $company = $this->tenants->resolveForUser($request->user());

        if ($company === null) {
            abort(404, 'Usaha belum ditemukan.');
        }

        $company->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
        ]);

        CompanySetting::set($company->id, CompanySetting::KEY_LOGO, $validated['logo'] ?? null);
        CompanySetting::set($company->id, CompanySetting::KEY_ADDRESS, $validated['alamat_bisnis'] ?? null);
        CompanySetting::set($company->id, CompanySetting::KEY_TAX_PERCENT, $validated['konfigurasi_pajak_ppn'] ?? null);
        CompanySetting::set($company->id, CompanySetting::KEY_DEFAULT_SHIPPING_CITY, $validated['ongkir_kota_default'] ?? null);

        return redirect()->route('tenant-settings.index')
            ->with('success', 'Pengaturan usaha berhasil diperbarui.');
    }

    /**
     * Update an outlet's settings under the tenant.
     */
    public function updateOutlet(UpdateOutletSettingRequest $request, Outlet $outlet): RedirectResponse
    {
        $this->authorize('update', $outlet);

        $validated = $request->validated();

        $outlet->update($validated);

        return redirect()->route('tenant-settings.index')
            ->with('success', 'Pengaturan outlet berhasil diperbarui.');
    }

    /**
     * @return array{logo: string|null, alamat_bisnis: string|null, konfigurasi_pajak_ppn: string|null, ongkir_kota_default: string|null}
     */
    private function settingsPayload(int $companyId): array
    {
        return [
            'logo' => (string) (CompanySetting::get($companyId, CompanySetting::KEY_LOGO) ?? ''),
            'alamat_bisnis' => (string) (CompanySetting::get($companyId, CompanySetting::KEY_ADDRESS) ?? ''),
            'konfigurasi_pajak_ppn' => (string) (CompanySetting::get($companyId, CompanySetting::KEY_TAX_PERCENT) ?? self::DEFAULTS['ppn']),
            'ongkir_kota_default' => (string) (CompanySetting::get($companyId, CompanySetting::KEY_DEFAULT_SHIPPING_CITY) ?? ''),
        ];
    }
}
