<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    seedRoles();
    seedPlans();
});

it('redirects a user whose tenant has no outlet to the onboarding wizard', function () {
    $user = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();
    $user->update(['company_id' => $company->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding'));

    $this->actingAs($user)
        ->get(route('onboarding'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('onboarding/index')
            ->where('step', 1)
            ->where('max_step', 4));
});

it('does not redirect an owner whose tenant already has outlets', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $outlet = createOutlet();
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $outlet->company_id]);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk();
});

it('does not redirect a super admin with a bare tenant', function () {
    $user = createUserWithGlobalRole('super admin');
    $company = Company::factory()->create();
    $user->update(['company_id' => $company->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

it('completes the wizard creating an outlet, tenant and trial subscription', function () {
    $user = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();
    $user->update(['company_id' => $company->id]);

    $this->actingAs($user)
        ->post(route('onboarding.profile'), [
            'name' => 'Toko Sukses',
            'slug' => 'toko-sukses',
            'alamat_bisnis' => 'Jl. Melati No. 1, Jakarta',
        ])
        ->assertRedirect(route('onboarding'));

    $plan = Plan::where('slug', 'standard')->first();

    $this->actingAs($user)
        ->post(route('onboarding.plan'), ['plan_id' => $plan->id])
        ->assertRedirect(route('onboarding'));

    $this->actingAs($user)
        ->post(route('onboarding.outlet'), [
            'nama_outlet' => 'Toko Pusat',
            'alamat_outlet' => 'Jl. Mawar No. 1',
            'kota' => 'Jakarta',
        ])
        ->assertRedirect(route('onboarding'));

    $this->actingAs($user)
        ->post(route('onboarding.finish'), [
            'konfigurasi_pajak_ppn' => '11',
            'mata_uang' => 'IDR',
            'alamat_pengiriman_default' => 'Jl. Mawar No. 1',
        ])
        ->assertRedirect(route('dashboard'));

    $company->refresh();

    expect($company->name)->toBe('Toko Sukses')
        ->and($company->outlets()->count())->toBe(1)
        ->and($user->outlets()->count())->toBe(1)
        ->and($company->subscription()->first()->status)->toBe(Subscription::STATUS_TRIAL)
        ->and($company->subscription()->first()->plan->slug)->toBe('standard');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

it('swaps the plan when the tenant already has a subscription', function () {
    $user = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();
    $user->update(['company_id' => $company->id]);

    $gratis = Plan::where('slug', 'gratis')->first();
    $company->subscriptions()->create([
        'plan_id' => $gratis->id,
        'status' => Subscription::STATUS_ACTIVE,
        'starts_at' => now(),
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
    ]);

    $standard = Plan::where('slug', 'standard')->first();

    $this->actingAs($user)
        ->post(route('onboarding.plan'), ['plan_id' => $standard->id])
        ->assertRedirect(route('onboarding'));

    $company->refresh();

    expect($company->subscription()->first()->plan->slug)->toBe('standard')
        ->and(Subscription::where('company_id', $company->id)->where('status', Subscription::STATUS_CANCELLED)->count())->toBe(1);
});

it('allows skipping the current step and dismissing the wizard without blocking access', function () {
    $user = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();
    $user->update(['company_id' => $company->id]);

    $this->actingAs($user)
        ->post(route('onboarding.skip'))
        ->assertRedirect(route('onboarding'));

    expect((int) session('onboarding.step'))->toBe(2);

    $this->actingAs($user)
        ->get(route('onboarding'))
        ->assertInertia(fn (Assert $page) => $page->where('step', 2));

    $this->actingAs($user)
        ->post(route('onboarding.dismiss'))
        ->assertRedirect(route('dashboard'));

    expect((bool) session('onboarding.dismissed'))->toBeTrue()
        ->and(session()->has('onboarding.step'))->toBeFalse();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});
