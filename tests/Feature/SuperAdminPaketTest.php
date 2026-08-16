<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\SubscriptionService;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
});

it('lists every package with its metrics and subscribers', function () {
    $plan = Plan::factory()->create([
        'name' => 'Gratis',
        'slug' => 'gratis',
        'price_monthly' => 0,
    ]);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $this->actingAs($this->admin)
        ->get(route('admin.paket'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.totalPlans', 1)
            ->where('metrics.activePlans', 1)
            ->where('metrics.totalSubscribers', 1)
            ->where('metrics.mrr', 0)
            ->where('plans.0.name', 'Gratis')
            ->where('plans.0.subscriber_count', 1));
});

it('allows a super admin to create a package with features', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.paket.store'), [
            'name' => 'Ultra',
            'slug' => 'ultra',
            'description' => 'Paket lengkap tanpa batas.',
            'price_monthly' => 999000,
            'max_outlets' => null,
            'max_products' => null,
            'max_staff' => null,
            'trial_days' => 7,
            'is_active' => true,
            'features' => ['multi_kasir', 'api_akses'],
        ])
        ->assertRedirect(route('admin.paket'))
        ->assertSessionHas('success');

    $plan = Plan::where('slug', 'ultra')->firstOrFail();
    expect($plan->price_monthly)->toBe(999000.0);
    expect($plan->featureKeys())->toContain('multi_kasir', 'api_akses');
});

it('generates a slug from the name when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.paket.store'), [
            'name' => 'Paket Hemat Jaya',
            'slug' => '',
            'price_monthly' => 50000,
            'trial_days' => 14,
        ])
        ->assertRedirect(route('admin.paket'));

    expect(Plan::where('slug', 'paket-hemat-jaya')->exists())->toBeTrue();
});

it('allows a super admin to update a package and its features', function () {
    $plan = Plan::factory()->create([
        'name' => 'Standard',
        'slug' => 'standard',
    ]);
    $plan->features()->createMany([
        ['feature' => 'multi_kasir', 'value' => '1'],
        ['feature' => 'api_akses', 'value' => '1'],
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.paket.update', $plan), [
            'name' => 'Standard Baru',
            'slug' => 'standard-baru',
            'price_monthly' => 199000,
            'max_outlets' => 3,
            'max_products' => 200,
            'max_staff' => 5,
            'trial_days' => 14,
            'is_active' => true,
            'features' => ['laporan_lanjutan'],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $plan->refresh();
    expect($plan->name)->toBe('Standard Baru');
    expect($plan->max_products)->toBe(200);
    expect($plan->featureKeys())->toHaveCount(1);
    expect($plan->featureKeys())->toContain('laporan_lanjutan');
});

it('deletes a package that has no subscriptions', function () {
    $plan = Plan::factory()->create(['name' => 'Paket Uji']);

    $this->actingAs($this->admin)
        ->delete(route('admin.paket.destroy', $plan))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Plan::find($plan->id))->toBeNull();
});

it('refuses to delete a package still in use by a tenant', function () {
    $plan = Plan::factory()->create(['name' => 'Paket Dipakai']);
    $company = Company::factory()->create();
    app(SubscriptionService::class)->subscribe($company, $plan, Subscription::STATUS_ACTIVE);

    $this->actingAs($this->admin)
        ->delete(route('admin.paket.destroy', $plan))
        ->assertSessionHas('error');

    expect(Plan::find($plan->id))->not->toBeNull();
});

it('toggles a package on and off', function () {
    Plan::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create(['is_active' => true]);

    $this->actingAs($this->admin)
        ->post(route('admin.paket.toggle', $plan))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($plan->fresh()->is_active)->toBeFalse();

    $this->actingAs($this->admin)
        ->post(route('admin.paket.toggle', $plan))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($plan->fresh()->is_active)->toBeTrue();
});

it('keeps at least one package active', function () {
    $plan = Plan::factory()->create(['is_active' => true]);

    $this->actingAs($this->admin)
        ->post(route('admin.paket.toggle', $plan))
        ->assertSessionHas('error');

    expect($plan->fresh()->is_active)->toBeTrue();
});

it('validates package input', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.paket.store'), [
            'name' => '',
            'slug' => 'SLUG SALAH',
            'price_monthly' => -5,
            'trial_days' => -1,
            'features' => ['fitur_tidak_dikenal'],
        ])
        ->assertSessionHasErrors(['name', 'slug', 'price_monthly', 'trial_days', 'features.0']);
});

it('rejects a duplicate package slug', function () {
    Plan::factory()->create(['slug' => 'gratis']);

    $this->actingAs($this->admin)
        ->post(route('admin.paket.store'), [
            'name' => 'Paket Gratis',
            'slug' => 'gratis',
            'price_monthly' => 0,
            'trial_days' => 14,
        ])
        ->assertSessionHasErrors('slug');
});

it('denies non-super-admin users on package routes', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $plan = Plan::factory()->create();

    $this->actingAs($owner)->get(route('admin.paket'))->assertForbidden();
    $this->actingAs($owner)->post(route('admin.paket.store'), [])->assertForbidden();
    $this->actingAs($owner)->put(route('admin.paket.update', $plan), [])->assertForbidden();
    $this->actingAs($owner)->delete(route('admin.paket.destroy', $plan))->assertForbidden();
    $this->actingAs($owner)->post(route('admin.paket.toggle', $plan))->assertForbidden();
});
