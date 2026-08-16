<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Plan;
use App\Models\Produk;
use App\Models\Subscription;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SubscriptionService
{
    public const RESOURCE_OUTLETS = 'outlets';

    public const RESOURCE_PRODUCTS = 'products';

    public const RESOURCE_STAFF = 'staff';

    /**
     * The active plan for the given company, or null when absent.
     */
    public function plan(Company $company): ?Plan
    {
        return $company->plan();
    }

    /**
     * Create a subscription for the company.
     */
    public function subscribe(Company $company, Plan $plan, string $status = Subscription::STATUS_TRIAL): Subscription
    {
        $now = Carbon::now();

        return Subscription::create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => $status,
            'starts_at' => $now,
            'trial_ends_at' => $status === Subscription::STATUS_TRIAL
                ? $now->copy()->addDays($plan->trial_days)
                : null,
        ]);
    }

    /**
     * Swap the company to a different plan.
     */
    public function changePlan(Company $company, Plan $plan): Subscription
    {
        $company->subscriptions()->update(['status' => Subscription::STATUS_CANCELLED]);

        return $this->subscribe($company, $plan, Subscription::STATUS_ACTIVE);
    }

    /**
     * Current usage for the company across all its outlets.
     *
     * @return array{outlets: int, products: int, staff: int}
     */
    public function usage(Company $company): array
    {
        $outletIds = $company->outlets()->pluck('outlets.id');

        $ownerIds = $company->users()->pluck('users.id');

        $staffCount = $company->outlets()
            ->with(['users' => fn ($query) => $query->select('users.id')])
            ->get()
            ->pluck('users')
            ->flatten()
            ->pluck('id')
            ->unique()
            ->reject(fn (int $id) => $ownerIds->contains($id))
            ->count();

        return [
            'outlets' => $outletIds->count(),
            'products' => (int) Produk::whereIn('id_outlet', $outletIds)->count(),
            'staff' => $staffCount,
        ];
    }

    /**
     * Whether the company may still create more of the given resource.
     *
     * Companies without an assigned plan (legacy data) are treated as
     * unlimited so existing tenants are not locked out during migration.
     */
    public function canCreate(Company $company, string $resource): bool
    {
        $plan = $this->plan($company);

        if ($plan === null) {
            return true;
        }

        $usage = $this->usage($company);
        $limit = match ($resource) {
            self::RESOURCE_OUTLETS => $plan->max_outlets,
            self::RESOURCE_PRODUCTS => $plan->max_products,
            self::RESOURCE_STAFF => $plan->max_staff,
            default => null,
        };

        return $limit === null || $usage[$resource] < $limit;
    }

    /**
     * Abort the request when the company exceeded the resource limit.
     */
    public function assertCanCreate(Company $company, string $resource): void
    {
        if (! $this->canCreate($company, $resource)) {
            $label = $this->resourceLabel($resource);

            throw new HttpException(403, "Batas jumlah {$label} untuk paket Anda telah tercapai. Silakan upgrade paket.");
        }
    }

    /**
     * Whether the company's plan grants the given feature.
     */
    public function hasFeature(Company $company, string $feature): bool
    {
        return $this->plan($company)?->hasFeature($feature) ?? false;
    }

    /**
     * Human-readable label for a resource key.
     */
    public function resourceLabel(string $resource): string
    {
        return match ($resource) {
            self::RESOURCE_OUTLETS => 'outlet',
            self::RESOURCE_PRODUCTS => 'produk',
            self::RESOURCE_STAFF => 'karyawan',
            default => $resource,
        };
    }
}
