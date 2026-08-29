<?php

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Kategori;
use App\Models\Plan;
use App\Models\Produk;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use App\Services\SubscriptionService;
use Carbon\CarbonImmutable;

function createSuperAdmin(): User
{
    return createUserWithGlobalRole('super admin');
}

function trialSubscription(): Subscription
{
    $company = Company::factory()->create();

    $plan = Plan::firstOrCreate(
        ['slug' => 'standard'],
        ['name' => 'Standard', 'price_monthly' => 149000, 'trial_days' => 14],
    );

    return app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_TRIAL);
}

it('lets a super admin view the admin billing page', function () {
    $this->actingAs(createSuperAdmin());

    $this->get(route('admin.billing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/billing'));
});

it('lets the tenant owner view their billing page', function () {
    $subscription = trialSubscription();
    $user = createUserWithGlobalRole('owner outlet');
    $user->update(['company_id' => $subscription->company_id]);

    $this->actingAs($user);

    $this->get(route('billing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('akun_users/billing')
            ->has('subscription')
            ->where('subscription.plan', $subscription->plan->name));
});

it('lets the tenant owner view their invoice history', function () {
    $subscription = trialSubscription();

    $plan = $subscription->plan;
    $invoice = SubscriptionInvoice::create([
        'subscription_id' => $subscription->id,
        'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
        'amount' => $plan->price_monthly,
        'status' => SubscriptionInvoice::STATUS_PENDING,
        'period_start' => now(),
        'period_end' => now()->addMonth(),
    ]);

    $user = createUserWithGlobalRole('owner outlet');
    $user->update(['company_id' => $subscription->company_id]);

    $this->actingAs($user);

    $this->get(route('billing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('invoices', 1)
            ->where('invoices.0.invoice_number', $invoice->invoice_number));
});

it('lets the tenant owner pay a pending invoice from their billing page', function () {
    $subscription = trialSubscription();
    $plan = $subscription->plan;

    $invoice = SubscriptionInvoice::create([
        'subscription_id' => $subscription->id,
        'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
        'amount' => $plan->price_monthly,
        'status' => SubscriptionInvoice::STATUS_PENDING,
        'period_start' => now(),
        'period_end' => now()->addMonth(),
    ]);

    $user = createUserWithGlobalRole('owner outlet');
    $user->update(['company_id' => $subscription->company_id]);

    $this->actingAs($user);

    $this->post(route('billing.pay'), ['invoice_id' => $invoice->id])
        ->assertRedirect();

    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PAID);
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);
});

it('prevents a tenant from paying another tenant invoice', function () {
    $subscription = trialSubscription();
    $plan = $subscription->plan;

    $invoice = SubscriptionInvoice::create([
        'subscription_id' => $subscription->id,
        'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
        'amount' => $plan->price_monthly,
        'status' => SubscriptionInvoice::STATUS_PENDING,
    ]);

    $otherSubscription = trialSubscription();
    $user = createUserWithGlobalRole('owner outlet');
    $user->update(['company_id' => $otherSubscription->company_id]);

    $this->actingAs($user);

    $this->post(route('billing.pay'), ['invoice_id' => $invoice->id])
        ->assertForbidden();
});

it('lets the super admin trigger billing processing', function () {
    $this->actingAs(createSuperAdmin());

    trialSubscription();

    CarbonImmutable::setTestNow(now()->addDays(15));

    $this->post(route('admin.billing.process'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SubscriptionInvoice::count())->toBe(1);
});

it('blocks non-super-admin from the admin billing page', function () {
    $this->actingAs(createUserWithGlobalRole('owner outlet'));

    $this->get(route('admin.billing'))->assertForbidden();
});

it('lets a super admin view audit logs', function () {
    $this->actingAs(createSuperAdmin());

    $this->get(route('admin.audit-logs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/audit-logs'));
});

it('seeds audit logs from observed actions visible to the admin', function () {
    $admin = createSuperAdmin();
    $this->actingAs($admin);

    $company = Company::factory()->create();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);

    $outlet = createOutlet(['company_id' => $company->id]);
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'auditable_type' => Produk::class,
        'auditable_id' => $produk->id,
        'event' => AuditLog::EVENT_CREATED,
    ]);

    $this->get(route('admin.audit-logs'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('logs'));
});
