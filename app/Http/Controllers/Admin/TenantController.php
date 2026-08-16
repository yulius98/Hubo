<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Produk;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct(protected SubscriptionService $subscriptions) {}

    /**
     * List every tenant on the platform.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', '');

        $tenants = Company::query()
            ->with(['subscription.plan:id,name,slug,price_monthly'])
            ->when($search !== '', fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"))
            ->when(in_array($status, ['active', 'trial', 'suspended', 'expired'], true), fn ($query) => $query
                ->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $tenants->getCollection()->transform(
            fn (Company $company) => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'status' => $company->status,
                'plan' => $company->subscription?->plan?->name ?? '—',
                'plan_slug' => $company->subscription?->plan?->slug ?? null,
                'outlet_count' => (int) $company->outlets()->count(),
                'user_count' => (int) $company->users()->count(),
                'created_at' => $company->created_at,
            ]
        );

        $plans = Plan::where('is_active', true)
            ->orderBy('price_monthly')
            ->get(['id', 'name', 'slug', 'price_monthly']);

        return Inertia::render('admin/tenants', [
            'tenants' => $tenants,
            'plans' => $plans,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Detail page of a single tenant.
     */
    public function show(Company $company): Response
    {
        $subscription = $company->subscription()->with('plan:id,name,slug,price_monthly,max_outlets,max_products,max_staff')->first();

        $outlets = $company->outlets()
            ->get(['id', 'nama_outlet', 'kota', 'created_at']);

        $productCount = (int) Produk::whereIn('id_outlet', $company->outlets()->pluck('outlets.id'))->count();

        $staff = $company->outlets()
            ->with(['users' => fn ($query) => $query->select('users.id', 'users.name', 'users.email', 'users.avatar')])
            ->get()
            ->pluck('users')
            ->flatten()
            ->unique('id')
            ->values();

        $plans = Plan::where('is_active', true)
            ->orderBy('price_monthly')
            ->get(['id', 'name', 'slug', 'price_monthly']);

        return Inertia::render('admin/tenant-detail', [
            'tenant' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'status' => $company->status,
                'trial_ends_at' => $company->trial_ends_at,
                'created_at' => $company->created_at,
                'outlet_count' => $outlets->count(),
                'product_count' => $productCount,
                'staff_count' => $staff->count(),
            ],
            'subscription' => $subscription,
            'outlets' => $outlets,
            'staff' => $staff,
            'plans' => $plans,
        ]);
    }

    /**
     * Suspend a tenant so its users can no longer operate.
     */
    public function suspend(Company $company)
    {
        $company->suspend();

        return redirect()->back()->with('success', 'Tenant berhasil diblokir.');
    }

    /**
     * Re-activate a suspended tenant.
     */
    public function activate(Company $company)
    {
        $company->activate();

        return redirect()->back()->with('success', 'Tenant berhasil diaktifkan kembali.');
    }

    /**
     * Change the plan of a tenant's active subscription.
     */
    public function changePlan(Request $request, Company $company)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);

        $this->subscriptions->changePlan($company, $plan);

        return redirect()->back()->with('success', 'Paket tenant berhasil diperbarui.');
    }
}
