<?php

use App\Models\RequestRole;
use App\Models\User;

it('allows a plain user to request to become a staff member', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)->post(route('req_staff.add'), [
        'user_id' => $plainUser->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ])->assertSessionHasNoErrors();

    expect(RequestRole::where('user_id', $plainUser->id)->where('outlet_id', $outlet->id)->where('status', 'pending')->exists())->toBeTrue();
});

it('rejects a request from a user who is already an owner outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->post(route('req_staff.add'), [
        'user_id' => $owner->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('admin outlet'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ])->assertSessionHasErrors('role_id');

    expect(RequestRole::where('user_id', $owner->id)->exists())->toBeFalse();
});

it('rejects an admin outlet requesting to become kasir', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');

    $this->actingAs($admin)->post(route('req_staff.add'), [
        'user_id' => $admin->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ])->assertSessionHasErrors('role_id');
});

it('rejects a kasir requesting to become an admin outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($kasir)->post(route('req_staff.add'), [
        'user_id' => $kasir->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('admin outlet'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ])->assertSessionHasErrors('role_id');
});

it('rejects a kasir requesting to become kasir in another outlet', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($kasir)->post(route('req_staff.add'), [
        'user_id' => $kasir->id,
        'owner_id' => $otherOwner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $otherOutlet->id,
        'status' => 'pending',
    ])->assertSessionHasErrors('role_id');
});

it('rejects a request when the owner_id is not the owner of the outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)->post(route('req_staff.add'), [
        'user_id' => $plainUser->id,
        'owner_id' => User::factory()->create()->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ])->assertSessionHasErrors('owner_id');

    expect(RequestRole::where('user_id', $plainUser->id)->exists())->toBeFalse();
});

it('attaches the requested role to the staff user when a request is approved', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = User::factory()->create();

    $requestRole = RequestRole::create([
        'user_id' => $staff->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id))->assertRedirect();

    expect($staff->fresh()->hasRole('kasir'))->toBeTrue();
    expect($staff->fresh()->outlets()
        ->wherePivot('outlet_id', $outlet->id)
        ->wherePivot('role_id', roleId('kasir'))
        ->exists())->toBeTrue();
    expect($requestRole->fresh()->status)->toBe('done');
});

it('replaces a conflicting role in the same outlet when a request is approved', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = attachUserToOutlet(User::factory()->create(), $outlet, 'kasir');

    $requestRole = RequestRole::create([
        'user_id' => $staff->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('admin outlet'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id))->assertRedirect();

    expect($staff->fresh()->outlets()
        ->wherePivot('outlet_id', $outlet->id)
        ->wherePivot('role_id', roleId('admin outlet'))
        ->exists())->toBeTrue();
    expect($staff->fresh()->outlets()
        ->wherePivot('outlet_id', $outlet->id)
        ->wherePivot('role_id', roleId('kasir'))
        ->exists())->toBeFalse();
});

it('does not approve a staff request twice', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = User::factory()->create();

    $requestRole = RequestRole::create([
        'user_id' => $staff->id,
        'owner_id' => $owner->id,
        'role_id' => roleId('kasir'),
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);

    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id))->assertRedirect();
    $this->actingAs($owner)->post(route('terima_staff', $requestRole->id))->assertRedirect();

    expect($staff->fresh()->outlets()->wherePivot('outlet_id', $outlet->id)->count())->toBe(1);
});

it('allows an owner to remove a staff member from their outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($owner)->post(route('remove_staff', $outlet->id), [
        'staff_id' => $staff->id,
    ])->assertRedirect();

    expect($staff->fresh()->outlets()->wherePivot('outlet_id', $outlet->id)->count())->toBe(0);
    expect($staff->fresh()->hasRole('kasir'))->toBeFalse();
    expect($staff->fresh()->hasRole('user'))->toBeTrue();
});

it('keeps the global role when the staff member still belongs to another outlet', function () {
    $outletA = createOutlet();
    $outletB = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $staff = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outletA, 'kasir');
    $staff = attachUserToOutlet($staff, $outletB, 'kasir');

    $this->actingAs($owner)->post(route('remove_staff', $outletA->id), [
        'staff_id' => $staff->id,
    ])->assertRedirect();

    expect($staff->fresh()->outlets()->wherePivot('outlet_id', $outletA->id)->count())->toBe(0);
    expect($staff->fresh()->outlets()->wherePivot('outlet_id', $outletB->id)->count())->toBe(1);
    expect($staff->fresh()->hasRole('kasir'))->toBeTrue();
});

it('does not allow an owner to remove another owner from the outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->post(route('remove_staff', $outlet->id), [
        'staff_id' => $otherOwner->id,
    ])->assertRedirect();

    expect($otherOwner->fresh()->hasOutletRole($outlet, 'owner outlet'))->toBeTrue();
});

it('does not allow a non-owner to remove staff from an outlet', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');
    $staff = attachUserToOutlet(User::factory()->create(), $outlet, 'kasir');

    $this->actingAs($otherOwner)->post(route('remove_staff', $outlet->id), [
        'staff_id' => $staff->id,
    ])->assertForbidden();

    expect($staff->fresh()->outlets()->wherePivot('outlet_id', $outlet->id)->count())->toBe(1);
});
