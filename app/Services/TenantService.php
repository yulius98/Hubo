<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Str;

class TenantService
{
    private ?Company $current = null;

    public function __construct(protected SubscriptionService $subscriptions) {}

    /**
     * Set the active tenant for the current request.
     */
    public function setCurrent(?Company $company): void
    {
        $this->current = $company;
    }

    /**
     * The tenant that is currently active for the request.
     */
    public function current(): ?Company
    {
        return $this->current;
    }

    /**
     * The id of the currently active tenant.
     */
    public function currentId(): ?int
    {
        return $this->current?->id;
    }

    /**
     * Resolve the tenant a user belongs to.
     */
    public function resolveForUser(?User $user): ?Company
    {
        if ($user === null) {
            return null;
        }

        if ($user->company_id !== null) {
            return $user->company()->first();
        }

        $companyId = $user->outlets()
            ->whereNotNull('outlets.company_id')
            ->value('outlets.company_id');

        if ($companyId !== null) {
            return Company::find($companyId);
        }

        return null;
    }

    /**
     * Resolve and store the tenant for the given user.
     */
    public function resolveAndSet(?User $user): ?Company
    {
        $company = $this->resolveForUser($user);

        $this->setCurrent($company);

        return $company;
    }

    /**
     * Return the user's company, creating one with the default plan when the
     * user does not own a company yet.
     */
    public function ensureCompanyForUser(User $user, ?string $preferredName = null): Company
    {
        $existing = $this->resolveForUser($user);

        if ($existing !== null) {
            return $existing;
        }

        $name = $preferredName ?: $user->name.' Store';

        $company = Company::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'status' => Company::STATUS_ACTIVE,
        ]);

        $user->update(['company_id' => $company->id]);

        $defaultPlan = Plan::query()
            ->where('is_active', true)
            ->where('slug', 'gratis')
            ->orderBy('price_monthly')
            ->first()
            ?? Plan::query()
                ->where('is_active', true)
                ->orderBy('price_monthly')
                ->first();

        if ($defaultPlan !== null) {
            $this->subscriptions->subscribe($company, $defaultPlan);
        }

        $this->setCurrent($company);

        return $company;
    }
}
