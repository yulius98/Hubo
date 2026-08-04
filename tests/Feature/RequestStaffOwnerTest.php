<?php

use App\Models\RequestRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createPendingRequest(User $staff, User $owner, int $roleId, $outlet): RequestRole
{
    return RequestRole::create([
        'user_id' => $staff->id,
        'owner_id' => $owner->id,
        'role_id' => $roleId,
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);
}

it('shows pending staff requests to the outlet owner on the request page', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = User::factory()->create(['name' => 'Budi Karyawan']);

    createPendingRequest($staff, $owner, roleId('kasir'), $outlet);

    $this->actingAs($owner)
        ->get(route('req_staff'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/request_menjadi_staff')
            ->has('pendingRequests', 1)
            ->where('pendingRequests.0.staff.name', 'Budi Karyawan')
            ->where('pendingRequests.0.outlet.nama_outlet', $outlet->nama_outlet)
            ->where('pendingRequests.0.role.role', 'kasir')
        );
});

it('does not show pending requests for outlets the owner does not own', function () {
    $ownedOutlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');

    $staff = User::factory()->create();
    createPendingRequest($staff, $otherOwner, roleId('kasir'), $otherOutlet);

    $this->actingAs($owner)
        ->get(route('req_staff'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/request_menjadi_staff')
            ->has('pendingRequests', 0)
        );
});

it('returns an empty pending request list for non-owner users', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $staff = User::factory()->create();
    createPendingRequest($staff, $owner, roleId('kasir'), $outlet);

    $this->actingAs($staff)
        ->get(route('req_staff'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/request_menjadi_staff')
            ->has('pendingRequests', 0)
        );
});

it('shares the pending request count to the navbar for owners', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $staff = User::factory()->create();

    createPendingRequest($staff, $owner, roleId('kasir'), $outlet);
    createPendingRequest($staff, $owner, roleId('admin outlet'), $outlet);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('pendingRequestCount', 2)
            ->has('pendingRequestList', 2)
        );
});

it('does not share pending request data for non-owner users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('pendingRequestCount', 0)
            ->where('pendingRequestList', [])
        );
});
