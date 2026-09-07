<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Outlet;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Subscription;
use App\Services\OnboardingService;
use App\Services\SubscriptionService;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        protected TenantService $tenants,
        protected OnboardingService $onboarding,
        protected SubscriptionService $subscriptions,
    ) {}

    /**
     * Show the first-run wizard for the current step.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $company = $this->tenants->resolveForUser($request->user());

        if ($company === null) {
            return redirect()->route('dashboard');
        }

        $step = $request->session()->get('onboarding.step', 0);

        if ($step === 0 && ! $this->onboarding->needsFor($company, $request)) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding/index', [
            'step' => $this->onboarding->step($request),
            'max_step' => OnboardingService::MAX_STEP,
            'company' => $company->only('id', 'name', 'slug', 'status'),
            'plans' => Plan::query()
                ->where('is_active', true)
                ->orderBy('price_monthly')
                ->get(['id', 'name', 'slug', 'price_monthly', 'trial_days', 'description']),
            'outlets' => $company->outlets()
                ->get(['id', 'nama_outlet', 'slug'])
                ->values(),
            'settings' => [
                'konfigurasi_pajak_ppn' => (string) (CompanySetting::get($company->id, CompanySetting::KEY_TAX_PERCENT) ?? '11'),
                'ongkir_kota_default' => (string) (CompanySetting::get($company->id, CompanySetting::KEY_DEFAULT_SHIPPING_CITY) ?? ''),
            ],
        ]);
    }

    /**
     * Step 1 — business profile (name, slug, logo, address).
     */
    public function saveProfile(Request $request): RedirectResponse
    {
        $company = $this->tenantCompany($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-_]+$/', Rule::unique('companies', 'slug')->ignore($company->id)],
            'logo' => ['nullable', 'string', 'max:255'],
            'alamat_bisnis' => ['nullable', 'string', 'max:1000'],
        ]);

        $company->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
        ]);

        CompanySetting::set($company->id, CompanySetting::KEY_LOGO, $validated['logo'] ?? null);
        CompanySetting::set($company->id, CompanySetting::KEY_ADDRESS, $validated['alamat_bisnis'] ?? null);

        $this->onboarding->advance($request);

        return redirect()->route('onboarding')
            ->with('success', 'Profil bisnis tersimpan.');
    }

    /**
     * Step 2 — choose a plan and confirm the trial.
     */
    public function savePlan(Request $request): RedirectResponse
    {
        $company = $this->tenantCompany($request);

        $validated = $request->validate([
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)],
        ]);

        if (! $company->subscription()->exists()) {
            $plan = Plan::findOrFail($validated['plan_id']);
            $this->subscriptions->subscribe($company, $plan, Subscription::STATUS_TRIAL);
        }

        $this->onboarding->advance($request);

        return redirect()->route('onboarding')
            ->with('success', 'Paket dipilih. Trial dimulai.');
    }

    /**
     * Step 3 — create the first outlet.
     */
    public function saveOutlet(Request $request): RedirectResponse
    {
        $user = $request->user();
        $company = $this->tenantCompany($request);

        $this->subscriptions->assertCanCreate($company, SubscriptionService::RESOURCE_OUTLETS);

        $validated = $request->validate([
            'nama_outlet' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-_]+$/', Rule::unique('outlets', 'slug')],
            'alamat_outlet' => ['nullable', 'string', 'max:1000'],
            'kota' => ['nullable', 'string', 'max:255'],
            'telp' => ['nullable', 'string', 'max:20'],
        ]);

        $validated['slug'] = $validated['slug'] ?? $this->uniqueSlug($validated['nama_outlet']);

        $outlet = $company->outlets()->create($validated);

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $user->outlets()->attach($outlet->id, ['role_id' => $ownerRoleId]);
        $user->role()->syncWithoutDetaching([$ownerRoleId]);

        $this->onboarding->advance($request);

        return redirect()->route('onboarding')
            ->with('success', 'Outlet pertama berhasil dibuat.');
    }

    /**
     * Step 4 — quick configuration, then start.
     */
    public function saveFinish(Request $request): RedirectResponse
    {
        $company = $this->tenantCompany($request);

        $validated = $request->validate([
            'konfigurasi_pajak_ppn' => ['nullable', 'string', 'in:10,11', 'max:5'],
            'ongkir_kota_default' => ['nullable', 'string', 'max:255'],
            'mata_uang' => ['nullable', 'string', 'max:10'],
            'alamat_pengiriman_default' => ['nullable', 'string', 'max:1000'],
        ]);

        CompanySetting::set($company->id, CompanySetting::KEY_TAX_PERCENT, $validated['konfigurasi_pajak_ppn'] ?? '11');
        CompanySetting::set($company->id, CompanySetting::KEY_DEFAULT_SHIPPING_CITY, $validated['ongkir_kota_default'] ?? null);

        $outlet = $company->outlets()->orderBy('id')->first();

        if ($outlet !== null) {
            $outlet->update([
                'mata_uang' => $validated['mata_uang'] ?? $outlet->mata_uang,
                'alamat_pengiriman_default' => $validated['alamat_pengiriman_default'] ?? $outlet->alamat_pengiriman_default,
            ]);
        }

        $this->onboarding->complete($request);

        return redirect()->route('dashboard')
            ->with('success', 'Selamat datang! Usaha Anda siap digunakan.');
    }

    /**
     * Skip the current step (or dismiss the wizard on the last step).
     */
    public function skip(Request $request): RedirectResponse
    {
        $company = $this->tenantCompany($request);

        $advanced = $this->onboarding->advance($request);

        if ($advanced) {
            return redirect()->route('onboarding')
                ->with('success', 'Langkah dilewati.');
        }

        $this->onboarding->dismiss($request);

        return redirect()->route('dashboard')
            ->with('success', 'Wizard dilewati. Anda dapat menyelesaikannya kapan saja.');
    }

    /**
     * Dismiss the wizard without completing it.
     */
    public function dismiss(Request $request): RedirectResponse
    {
        $this->tenantCompany($request);

        $this->onboarding->dismiss($request);

        return redirect()->route('dashboard')
            ->with('success', 'Wizard ditutup. Akses tidak dibatasi.');
    }

    private function tenantCompany(Request $request): Company
    {
        $company = $this->tenants->resolveForUser($request->user());

        if ($company === null) {
            abort(403, 'Usaha belum ditemukan.');
        }

        return $company;
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'toko';
        $slug = $base;
        $counter = 2;

        while (Outlet::query()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
