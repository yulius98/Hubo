<?php

namespace App\Providers;

use App\Services\TenantService;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Broadcast::routes(['middleware' => ['web', 'auth']]);

        /*
         * A tenant staff member may subscribe to the private channel of the
         * tenant they belong to (private-tenant.{tenantId}).
         */
        Broadcast::channel('tenant.{tenantId}', function ($user, $tenantId) {
            $company = app(TenantService::class)->resolveForUser($user);

            return $company !== null && $company->id === (int) $tenantId;
        });
    }
}
