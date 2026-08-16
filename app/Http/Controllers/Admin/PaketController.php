<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PlanRequest;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaketController extends Controller
{
    /**
     * The recognized feature keys for every package, mapped to a display label.
     *
     * @var array<string, string>
     */
    public const FEATURE_CATALOG = [
        'multi_kasir' => 'Multi Kasir',
        'multi_outlet' => 'Multi Outlet',
        'laporan_lanjutan' => 'Laporan Lanjutan',
        'api_akses' => 'Akses API',
        'prioritas_dukungan' => 'Dukungan Prioritas',
    ];

    /**
     * List every package with its subscriber count and platform metrics.
     */
    public function index(): Response
    {
        $plans = Plan::query()
            ->with('features')
            ->withCount([
                'subscriptions as active_subscriber_count' => fn ($query) => $query
                    ->where('status', Subscription::STATUS_ACTIVE),
            ])
            ->orderBy('price_monthly')
            ->get()
            ->map(fn (Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price_monthly' => $plan->price_monthly,
                'max_outlets' => $plan->max_outlets,
                'max_products' => $plan->max_products,
                'max_staff' => $plan->max_staff,
                'trial_days' => $plan->trial_days,
                'is_active' => $plan->is_active,
                'subscriber_count' => (int) $plan->active_subscriber_count,
                'features' => $plan->features
                    ->sortBy('id')
                    ->map(fn ($feature) => [
                        'key' => $feature->feature,
                        'label' => self::FEATURE_CATALOG[$feature->feature] ?? $feature->feature,
                    ])
                    ->values(),
            ])
            ->values();

        $totalSubscribers = $plans->sum('subscriber_count');
        $mrr = $plans->sum(fn (array $plan) => $plan['price_monthly'] * $plan['subscriber_count']);

        return Inertia::render('admin/paket', [
            'plans' => $plans,
            'feature_catalog' => collect(self::FEATURE_CATALOG)
                ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])
                ->values(),
            'metrics' => [
                'totalPlans' => $plans->count(),
                'activePlans' => $plans->where('is_active', true)->count(),
                'totalSubscribers' => $totalSubscribers,
                'mrr' => round($mrr, 2),
            ],
        ]);
    }

    /**
     * Create a new package.
     */
    public function store(PlanRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $features = $validated['features'] ?? [];
        unset($validated['features']);

        $plan = Plan::create($validated);
        $this->syncFeatures($plan, $features);

        return redirect()->route('admin.paket')
            ->with('success', "Paket {$plan->name} berhasil dibuat.");
    }

    /**
     * Update an existing package.
     */
    public function update(PlanRequest $request, Plan $plan): RedirectResponse
    {
        $validated = $request->validated();

        $features = $validated['features'] ?? [];
        unset($validated['features']);

        $plan->update($validated);
        $this->syncFeatures($plan, $features);

        return redirect()->back()
            ->with('success', "Paket {$plan->name} berhasil diperbarui.");
    }

    /**
     * Delete a package that is not used by any subscription.
     */
    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->subscriptions()->exists()) {
            return redirect()->back()
                ->with('error', 'Paket tidak dapat dihapus karena masih digunakan oleh tenant.');
        }

        $plan->delete();

        return redirect()->back()
            ->with('success', "Paket {$plan->name} berhasil dihapus.");
    }

    /**
     * Toggle whether a package is selectable by tenants.
     */
    public function toggleActive(Plan $plan): RedirectResponse
    {
        if ($plan->is_active && Plan::where('is_active', true)->count() <= 1) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menonaktifkan satu-satunya paket yang aktif.');
        }

        $plan->update(['is_active' => ! $plan->is_active]);

        return redirect()->back()
            ->with('success', "Paket {$plan->name} berhasil ".
                ($plan->is_active ? 'diaktifkan' : 'dinonaktifkan').'.');
    }

    /**
     * Replace the features of a package with the given keys.
     *
     * @param  list<string>  $features
     */
    private function syncFeatures(Plan $plan, array $features): void
    {
        $plan->features()->delete();

        $plan->features()->createMany(
            collect($features)
                ->map(fn (string $feature) => [
                    'feature' => $feature,
                    'value' => '1',
                ])
                ->all()
        );
    }
}
