<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionService;

beforeEach(function () {
    seedRoles();
});

it('lets an owner view the paket page with plan, usage, and available plans', function () {
    $plan = Plan::factory()->create(['name' => 'Gratis', 'slug' => 'gratis', 'max_outlets' => 2]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $otherPlan = Plan::factory()->create(['name' => 'Pro', 'slug' => 'pro', 'price_monthly' => 150000]);

    $this->actingAs($owner)
        ->get(route('paket'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('akun_users/paket_saya')
            ->where('plan.id', $plan->id)
            ->where('plan.name', 'Gratis')
            ->where('usage.outlets', 1)
            ->where('plans.0.id', $plan->id)
            ->where('plans.1.id', $otherPlan->id));
});

it('blocks non-owner roles from the paket page', function () {
    $company = Company::factory()->create();
    $kasir = createUserWithGlobalRole('kasir');
    $kasir->update(['company_id' => $company->id]);

    $this->actingAs($kasir)->get(route('paket'))->assertForbidden();
});

it('blocks a super admin from the paket page', function () {
    $plan = Plan::factory()->create(['name' => 'Gratis', 'slug' => 'gratis', 'max_outlets' => 2]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $superAdmin = createUserWithGlobalRole('super admin');
    $superAdmin->update(['company_id' => $company->id]);

    $this->actingAs($superAdmin)
        ->get(route('paket'))
        ->assertForbidden();
});

it('blocks a super admin from switching plans', function () {
    $current = Plan::factory()->create(['name' => 'Gratis', 'slug' => 'gratis']);
    $target = Plan::factory()->create(['name' => 'Pro', 'slug' => 'pro']);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $current, Subscription::STATUS_ACTIVE);

    $superAdmin = createUserWithGlobalRole('super admin');
    $superAdmin->update(['company_id' => $company->id]);

    $this->actingAs($superAdmin)
        ->post(route('paket.ganti'), ['plan_id' => $target->id])
        ->assertForbidden();

    expect($company->fresh()->plan()->is($current))->toBeTrue();
});

it('blocks a super admin from the paket page even without a company', function () {
    $superAdmin = createUserWithGlobalRole('super admin');

    $this->actingAs($superAdmin)->get(route('paket'))->assertForbidden();
});

it('redirects when the owner has no company yet', function () {
    $owner = createUserWithGlobalRole('owner outlet');

    $this->actingAs($owner)->get(route('paket'))->assertRedirect(route('dashboard'));
});

it('lets an owner switch to another plan that fits their usage', function () {
    $current = Plan::factory()->create(['name' => 'Gratis', 'slug' => 'gratis', 'max_outlets' => 2]);
    $target = Plan::factory()->create(['name' => 'Pro', 'slug' => 'pro', 'max_outlets' => 5]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $current, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)
        ->post(route('paket.ganti'), ['plan_id' => $target->id])
        ->assertRedirect()
        ->assertSessionHas('success', "Paket berhasil diperbarui ke {$target->name}.");

    expect($company->fresh()->plan()->is($target))->toBeTrue();
    expect($company->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->count())->toBe(1);
});

it('blocks downgrading to a plan below current usage', function () {
    $current = Plan::factory()->unlimited()->create(['name' => 'Pro', 'slug' => 'pro']);
    $limited = Plan::factory()->create(['name' => 'Gratis', 'slug' => 'gratis', 'max_outlets' => 1]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $current, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)
        ->post(route('paket.ganti'), ['plan_id' => $limited->id])
        ->assertRedirect()
        ->assertSessionHas('error', 'Pemakaian Anda saat ini melebihi batas paket tersebut. Silakan kurangi outlet, produk, atau staf terlebih dahulu.');

    expect($company->fresh()->plan()->is($current))->toBeTrue();
});

it('validates the plan id when switching plans', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)
        ->post(route('paket.ganti'), ['plan_id' => 999])
        ->assertSessionHasErrors('plan_id');
});

it('does not re-subscribe when switching to the current plan', function () {
    $current = Plan::factory()->create(['name' => 'Pro', 'slug' => 'pro']);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $current, Subscription::STATUS_ACTIVE);

    $outlet = createOutlet(['company_id' => $company->id]);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)
        ->post(route('paket.ganti'), ['plan_id' => $current->id])
        ->assertRedirect()
        ->assertSessionHas('error', 'Anda sudah berlangganan paket ini.');

    expect($company->fresh()->plan()->is($current))->toBeTrue();
    expect($company->subscriptions()->count())->toBe(1);
});
