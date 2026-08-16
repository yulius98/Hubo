<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Plan;
use App\Services\SubscriptionService;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PaketController extends Controller
{
    public function __construct(
        protected TenantService $tenants,
        protected SubscriptionService $subscriptions,
    ) {}

    /**
     * Show the active plan, quota usage, and available plans for the owner.
     */
    public function index(): Response|RedirectResponse
    {
        $company = $this->requireCompany();

        if ($company instanceof RedirectResponse) {
            return $company;
        }

        $plan = $this->subscriptions->plan($company);

        return Inertia::render('akun_users/paket_saya', [
            'tenant' => $company->only('id', 'name', 'slug', 'status'),
            'plan' => $plan ? $this->planPayload($plan->load('features')) : null,
            'usage' => $this->subscriptions->usage($company),
            'plans' => Plan::query()
                ->where('is_active', true)
                ->with('features')
                ->orderBy('price_monthly')
                ->get()
                ->map(fn (Plan $plan) => $this->planPayload($plan))
                ->values(),
        ]);
    }

    /**
     * Switch the tenant to a different plan (self-service, no billing yet).
     */
    public function changePlan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $company = $this->requireCompany();

        if ($company instanceof RedirectResponse) {
            return $company;
        }

        $plan = Plan::findOrFail($validated['plan_id']);

        if ($this->subscriptions->plan($company)?->is($plan)) {
            return redirect()->back()->with('error', 'Anda sudah berlangganan paket ini.');
        }

        if (! $this->fitsCurrentUsage($company, $plan)) {
            return redirect()->back()->with('error', 'Pemakaian Anda saat ini melebihi batas paket tersebut. Silakan kurangi outlet, produk, atau staf terlebih dahulu.');
        }

        $this->subscriptions->changePlan($company, $plan);

        return redirect()->back()->with('success', "Paket berhasil diperbarui ke {$plan->name}.");
    }

    /**
     * Whether the company's current usage fits inside the new plan limits.
     */
    private function fitsCurrentUsage(Company $company, Plan $plan): bool
    {
        $usage = $this->subscriptions->usage($company);

        return ($plan->max_outlets === null || $usage['outlets'] <= $plan->max_outlets)
            && ($plan->max_products === null || $usage['products'] <= $plan->max_products)
            && ($plan->max_staff === null || $usage['staff'] <= $plan->max_staff);
    }

    /**
     * @return array{id: int, name: string, slug: string, price_monthly: int, max_outlets: int|null, max_products: int|null, max_staff: int|null, features: string[]}
     */
    private function planPayload(Plan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price_monthly' => $plan->price_monthly,
            'max_outlets' => $plan->max_outlets,
            'max_products' => $plan->max_products,
            'max_staff' => $plan->max_staff,
            'features' => $plan->features->sortBy('id')->pluck('description')->all(),
        ];
    }

    /**
     * Resolve the company of the authenticated user, redirecting when absent.
     */
    private function requireCompany(): Company|RedirectResponse
    {
        $company = $this->tenants->resolveForUser(Auth::user());

        if ($company === null) {
            return redirect()->route('dashboard')->with('error', 'Anda belum memiliki tenant/company aktif.');
        }

        return $company;
    }
}
