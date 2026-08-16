<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use App\Services\TenantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureQuota
{
    public function __construct(
        protected TenantService $tenants,
        protected SubscriptionService $subscriptions,
    ) {}

    /**
     * Verify that the tenant of the authenticated user has not reached its
     * plan limit for the given resource.
     *
     * Example usage: `quota:outlets`
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $resource): Response
    {
        $company = $this->tenants->resolveForUser($request->user());

        abort_unless($company !== null, 403, 'Anda belum memiliki tenant/company aktif.');

        $this->subscriptions->assertCanCreate($company, $resource);

        return $next($request);
    }
}
