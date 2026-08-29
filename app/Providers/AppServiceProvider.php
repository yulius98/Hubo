<?php

namespace App\Providers;

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Kategori;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Observers\AuditObserver;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        $this->configureRateLimiting();

        Produk::observe(AuditObserver::class);
        Kategori::observe(AuditObserver::class);
        Outlet::observe(AuditObserver::class);
        Customer::observe(AuditObserver::class);
        Coupon::observe(AuditObserver::class);
        Supplier::observe(AuditObserver::class);
        Expense::observe(AuditObserver::class);
        PurchaseOrder::observe(AuditObserver::class);
        Order::observe(AuditObserver::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    /**
     * Register named rate limiters for public forms and APIs.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('webhooks', function (Request $request): Limit {
            return Limit::perMinute(30)->by($request->ip());
        });

        RateLimiter::for('checkout', function (Request $request): Limit {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request): Limit {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('storefront', function (Request $request): Limit {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
