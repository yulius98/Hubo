<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionService;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
});

it('shows platform metrics on the admin dashboard', function () {
    $plan = Plan::factory()->create(['price_monthly' => 100000]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.totalTenants', 1)
            ->where('metrics.activeTenants', 1)
            ->where('metrics.suspendedTenants', 0)
            ->where('metrics.mrr', 100000));
});

it('includes only active subscriptions in the MRR metric', function () {
    $plan = Plan::factory()->create(['price_monthly' => 100000]);
    $activeCompany = Company::factory()->create();
    $cancelledCompany = Company::factory()->create();

    app(SubscriptionService::class)->subscribe($activeCompany, $plan, Subscription::STATUS_ACTIVE);
    app(SubscriptionService::class)->subscribe($cancelledCompany, $plan, Subscription::STATUS_CANCELLED);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('metrics.mrr', 100000));
});

it('lists tenants with their plan and status', function () {
    $plan = Plan::factory()->create(['name' => 'Standard', 'slug' => 'standard']);
    $company = Company::factory()->create(['name' => 'Toko Jaya']);
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $this->actingAs($this->admin)
        ->get(route('admin.tenants'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tenants.total', 1)
            ->where('tenants.data.0.name', 'Toko Jaya')
            ->where('tenants.data.0.plan', 'Standard'));
});

it('allows a super admin to suspend and re-activate a tenant', function () {
    $company = Company::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.tenants.suspend', $company))
        ->assertRedirect();

    expect($company->fresh()->status)->toBe(Company::STATUS_SUSPENDED);
    expect($company->fresh()->isSuspended())->toBeTrue();

    $this->actingAs($this->admin)
        ->post(route('admin.tenants.activate', $company))
        ->assertRedirect();

    expect($company->fresh()->status)->toBe(Company::STATUS_ACTIVE);
    expect($company->fresh()->isActive())->toBeTrue();
});

it('allows a super admin to change the plan of a tenant', function () {
    $company = Company::factory()->create();
    $free = Plan::factory()->create(['slug' => 'gratis', 'max_outlets' => 1]);
    $premium = Plan::factory()->create(['slug' => 'premium', 'max_outlets' => null]);
    app(SubscriptionService::class)->subscribe($company, $free, Subscription::STATUS_ACTIVE);

    $this->actingAs($this->admin)
        ->put(route('admin.tenants.change-plan', $company), ['plan_id' => $premium->id])
        ->assertRedirect();

    expect($company->fresh()->plan()->id)->toBe($premium->id);
});

it('requires a valid plan when changing a tenant plan', function () {
    $company = Company::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.tenants.change-plan', $company), ['plan_id' => 999999])
        ->assertSessionHasErrors('plan_id');
});

it('shows the tenant detail with its outlets and staff', function () {
    $company = Company::factory()->create(['name' => 'Toko Sukses']);
    $outlet = createOutlet(['company_id' => $company->id]);
    $staff = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $staff->update(['company_id' => $company->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.tenants.show', $company))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tenant.name', 'Toko Sukses')
            ->where('tenant.outlet_count', 1)
            ->where('outlets.0.id', $outlet->id));
});
