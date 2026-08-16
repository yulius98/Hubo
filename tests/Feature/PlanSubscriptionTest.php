<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionService;

it('exposes features granted by a plan', function () {
    $plan = Plan::factory()->create();

    $plan->features()->createMany([
        ['feature' => 'multi_kasir', 'value' => '1'],
        ['feature' => 'laporan_lanjutan', 'value' => 'true'],
        ['feature' => 'multi_outlet', 'value' => '0'],
    ]);

    expect($plan->hasFeature('multi_kasir'))->toBeTrue();
    expect($plan->hasFeature('laporan_lanjutan'))->toBeTrue();
    expect($plan->hasFeature('multi_outlet'))->toBeFalse();
    expect($plan->featureKeys())->toContain('multi_kasir');
    expect($plan->featureKeys())->toContain('multi_outlet');
});

it('treats null limits as unlimited', function () {
    $plan = Plan::factory()->unlimited()->create();

    expect($plan->isUnlimitedOutlets())->toBeTrue();
    expect($plan->isUnlimitedProducts())->toBeTrue();
    expect($plan->isUnlimitedStaff())->toBeTrue();
});

it('creates a trial subscription with a trial end date', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['trial_days' => 14]);

    $subscription = app(SubscriptionService::class)->subscribe($company, $plan);

    expect($subscription->status)->toBe(Subscription::STATUS_TRIAL);
    expect($subscription->isTrial())->toBeTrue();
    expect($subscription->isActive())->toBeTrue();
    expect($subscription->trial_ends_at)->not->toBeNull();
    expect($subscription->trial_ends_at->isSameDay(
        $subscription->starts_at->copy()->addDays(14),
    ))->toBeTrue();
    expect($subscription->onTrial())->toBeTrue();
});

it('does not set a trial end date for a non-trial subscription', function () {
    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['trial_days' => 0]);

    $subscription = app(SubscriptionService::class)->subscribe(
        $company,
        $plan,
        Subscription::STATUS_ACTIVE,
    );

    expect($subscription->status)->toBe(Subscription::STATUS_ACTIVE);
    expect($subscription->trial_ends_at)->toBeNull();
});

it('swaps the plan and cancels the previous subscription', function () {
    $company = Company::factory()->create();
    $free = Plan::factory()->create(['slug' => 'gratis']);
    $premium = Plan::factory()->create(['slug' => 'premium']);

    $service = app(SubscriptionService::class);
    $service->subscribe($company, $free, Subscription::STATUS_ACTIVE);
    $service->changePlan($company, $premium);

    expect($company->subscriptions()->where('status', Subscription::STATUS_CANCELLED)->count())->toBe(1);
    expect($company->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->count())->toBe(1);
    expect($company->fresh()->plan()->id)->toBe($premium->id);
});

it('resolves the active plan through the latest subscription', function () {
    $company = Company::factory()->create();
    $free = Plan::factory()->create(['slug' => 'gratis']);

    app(SubscriptionService::class)->subscribe($company, $free, Subscription::STATUS_ACTIVE);

    expect($company->fresh()->plan()->slug)->toBe('gratis');
    expect($company->fresh()->subscription->plan->id)->toBe($free->id);
});
