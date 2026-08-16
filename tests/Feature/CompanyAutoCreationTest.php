<?php

use App\Models\Outlet;
use App\Models\Plan;
use App\Models\User;
use App\Services\SubscriptionService;

it('creates a company with the default plan when a user opens their first outlet', function () {
    seedRoles();
    seedPlans();

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Toko Pertama',
        'alamat_outlet' => 'Jalan Mawar No. 1',
        'kota' => 'Jakarta',
        'telp' => '0812-0000-0000',
    ])->assertRedirect();

    $user->refresh();

    expect($user->company_id)->not->toBeNull();
    expect($user->company->plan()->slug)->toBe('gratis');
    expect($user->hasRole('owner outlet'))->toBeTrue();

    $outlet = Outlet::where('company_id', $user->company_id)->first();
    expect($outlet)->not->toBeNull();
    expect($outlet->nama_outlet)->toBe('Toko Pertama');
});

it('reuses the existing company when the user opens another outlet', function () {
    seedRoles();
    seedPlans();

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Toko Pertama',
        'alamat_outlet' => 'Jalan Mawar No. 1',
        'kota' => 'Jakarta',
        'telp' => '0812-0000-0000',
    ])->assertRedirect();

    $user->refresh();
    $firstCompany = $user->company_id;

    $premium = Plan::where('slug', 'premium')->firstOrFail();
    app(SubscriptionService::class)->changePlan($user->company, $premium);

    $this->actingAs($user)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Toko Kedua',
        'alamat_outlet' => 'Jalan Melati No. 2',
        'kota' => 'Bandung',
        'telp' => '0812-0000-0001',
    ])->assertRedirect();

    $user->refresh();

    expect($user->company_id)->toBe($firstCompany);
    expect(Outlet::where('company_id', $firstCompany)->count())->toBe(2);
});

it('blocks a second outlet when the free plan allows only one', function () {
    seedRoles();
    seedPlans();

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Toko Pertama',
        'alamat_outlet' => 'Jalan Mawar No. 1',
        'kota' => 'Jakarta',
        'telp' => '0812-0000-0000',
    ])->assertRedirect();

    $this->actingAs($user)->post(route('myoutlet.add'), [
        'nama_outlet' => 'Toko Kedua',
        'alamat_outlet' => 'Jalan Melati No. 2',
        'kota' => 'Bandung',
        'telp' => '0812-0000-0001',
    ])->assertForbidden();

    expect(Outlet::where('company_id', $user->fresh()->company_id)->count())->toBe(1);
});
