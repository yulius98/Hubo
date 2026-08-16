<?php

use App\Models\Company;
use App\Models\Plan;
use App\Models\User;

it('allows a super admin to open the admin dashboard', function () {
    $admin = createUserWithGlobalRole('super admin');

    $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
});

it('denies non-super-admin users on the admin dashboard', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $this->actingAs($owner)->get(route('admin.dashboard'))->assertForbidden();

    $kasir = createUserWithGlobalRole('kasir');
    $this->actingAs($kasir)->get(route('admin.dashboard'))->assertForbidden();

    $plainUser = User::factory()->create();
    $this->actingAs($plainUser)->get(route('admin.dashboard'))->assertForbidden();
});

it('denies a non-super-admin user on tenant management routes', function () {
    $admin = createUserWithGlobalRole('super admin');
    $company = Company::factory()->create();

    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)->get(route('admin.tenants'))->assertForbidden();
    $this->actingAs($plainUser)->get(route('admin.tenants.show', $company))->assertForbidden();
    $this->actingAs($plainUser)->post(route('admin.tenants.suspend', $company))->assertForbidden();
    $this->actingAs($plainUser)->put(route('admin.tenants.change-plan', $company), [
        'plan_id' => Plan::factory()->create()->id,
    ])->assertForbidden();
});

it('redirects guests away from the admin dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect();
});

it('reports a super admin user through the isSuperAdmin helper', function () {
    $admin = createUserWithGlobalRole('super admin');
    $plainUser = User::factory()->create();

    expect($admin->isSuperAdmin())->toBeTrue();
    expect($plainUser->isSuperAdmin())->toBeFalse();
});

it('blocks authenticated requests once the tenant is suspended', function () {
    $company = Company::factory()->create(['status' => 'suspended']);
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)->get(route('dashboard'))->assertForbidden();
});

it('lets a tenant operate again once it is activated', function () {
    $company = Company::factory()->create(['status' => 'active']);
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner)->get(route('dashboard'))->assertOk();
});
