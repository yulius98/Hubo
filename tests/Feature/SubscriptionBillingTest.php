<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Services\SubscriptionBillingService;
use App\Services\SubscriptionService;
use Carbon\CarbonImmutable;

function ensureSubscription(Company $company, Plan $plan, string $status): Subscription
{
    return app(SubscriptionService::class)->subscribe($company, $plan, $status);
}

it('creates an invoice when a trial ends on a paid plan', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_TRIAL);

    CarbonImmutable::setTestNow(now()->addDays(15));

    $outcome = app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($outcome)->toBe('invoiced');
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_PAST_DUE);

    $invoice = $subscription->fresh()->invoices()->latest()->first();
    expect($invoice)->not->toBeNull();
    expect((float) $invoice->amount)->toBe(149000.0);
    expect($invoice->status)->toBe(SubscriptionInvoice::STATUS_PENDING);
    expect($invoice->period_start)->not->toBeNull();
    expect($invoice->period_end)->not->toBeNull();
});

it('renews a paid plan into the next period after the trial', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_TRIAL);

    CarbonImmutable::setTestNow(now()->addDays(16));

    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($subscription->fresh()->invoices()->count())->toBe(1);
    expect($subscription->fresh()->invoices()->latest()->first()->period_start->toDateString())
        ->toBe($subscription->fresh()->current_period_start->toDateString());
});

it('marks a free plan as active after the trial ends', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 0, 'trial_days' => 14]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_TRIAL);

    CarbonImmutable::setTestNow(now()->addDays(15));

    $outcome = app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($outcome)->toBe('free');
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);
    expect($subscription->fresh()->invoices()->count())->toBe(0);
});

it('bills the next period when an active subscription reaches period end', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 99000, 'trial_days' => 0]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_ACTIVE);

    CarbonImmutable::setTestNow(now()->addMonths(1)->addDay());

    $outcome = app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($outcome)->toBe('invoiced');
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_PAST_DUE);
});

it('expires a past-due subscription without payment and suspends the company', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 99000, 'trial_days' => 0]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_ACTIVE);

    CarbonImmutable::setTestNow(now()->addMonths(1)->addDay());
    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    CarbonImmutable::setTestNow(now()->addMonths(2)->addDay());
    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_EXPIRED);
    expect($company->fresh()->status)->toBe(Company::STATUS_EXPIRED);
});

it('pays a pending invoice and reactivates the subscription', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_TRIAL);

    CarbonImmutable::setTestNow(now()->addDays(15));
    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    $invoice = $subscription->fresh()->invoices()->latest()->first();

    app(SubscriptionBillingService::class)->payInvoice($invoice->fresh());

    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PAID);
    expect($invoice->fresh()->paid_at)->not->toBeNull();
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);
});

it('does not bill a trial that is still running', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_TRIAL);

    $outcome = app(SubscriptionBillingService::class)->settle($subscription->fresh());

    expect($outcome)->toBeNull();
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_TRIAL);
    expect($subscription->fresh()->invoices()->count())->toBe(0);
});

it('generates a unique subscription invoice number', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 100, 'trial_days' => 0]);

    $subscription = ensureSubscription($company, $plan, Subscription::STATUS_ACTIVE);

    CarbonImmutable::setTestNow(now()->addMonths(1)->addDay());
    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    $first = $subscription->fresh()->invoices()->first();
    $number = SubscriptionInvoice::generateInvoiceNumber();

    expect($number)->not->toBe($first->invoice_number);
});

it('processes due billing for many subscriptions via the service', function () {
    $free = Plan::factory()->create(['price_monthly' => 0, 'trial_days' => 14]);
    $paid = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();

    ensureSubscription($companyA, $free, Subscription::STATUS_TRIAL);
    ensureSubscription($companyB, $paid, Subscription::STATUS_TRIAL);

    CarbonImmutable::setTestNow(now()->addDays(15));

    $counts = app(SubscriptionBillingService::class)->processDueBilling();

    expect($counts['free'])->toBe(1);
    expect($counts['invoiced'])->toBe(1);
});
