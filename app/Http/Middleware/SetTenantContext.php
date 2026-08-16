<?php

namespace App\Http\Middleware;

use App\Services\TenantService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    public function __construct(protected TenantService $tenants) {}

    /**
     * Resolve the tenant for the authenticated user and store it for the
     * current request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $company = $this->tenants->resolveAndSet($request->user());

        if ($company !== null && $company->isSuspended()) {
            abort(403, 'Tenant Anda sedang diblokir. Hubungi administrator.');
        }

        return $next($request);
    }
}
