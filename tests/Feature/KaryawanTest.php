<?php

use App\Models\RequestRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows the employee management page for a selected outlet to its owner', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $admin = attachUserToOutlet(User::factory()->create(['name' => 'Sari Admin']), $outlet, 'admin outlet');
    $kasir = attachUserToOutlet(User::factory()->create(['name' => 'Budi Kasir']), $outlet, 'kasir');

    $pending = createKaryawanPendingRequest($kasir, $owner, roleId('kasir'), $outlet);

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('kelola_karyawan'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/kelola_karyawan')
            ->where('outlet.id', $outlet->id)
            ->where('outlet.nama_outlet', $outlet->nama_outlet)
            ->has('employees', 3)
            ->where('employees.0.name', $owner->name)
            ->where('employees.0.role', 'owner outlet')
            ->where('employees.1.name', 'Sari Admin')
            ->where('employees.1.role', 'admin outlet')
            ->where('employees.2.name', 'Budi Kasir')
            ->where('employees.2.role', 'kasir')
            ->has('pendingRequests', 1)
            ->where('pendingRequests.0.id', $pending->id)
            ->where('pendingRequests.0.role.role', 'kasir')
            ->has('roles')
        );
});

it('renders the page without employees when no outlet is selected', function () {
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), createOutlet(), 'owner outlet');

    $this->actingAs($owner)
        ->get(route('kelola_karyawan'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/kelola_karyawan')
            ->where('outlet', null)
            ->where('employees', [])
            ->where('pendingRequests', [])
        );
});

it('renders an empty state when the selected outlet is not owned', function () {
    $ownedOutlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $ownedOutlet, 'owner outlet');

    session(['selected_outlet_id' => $otherOutlet->id]);

    $this->actingAs($owner)
        ->get(route('kelola_karyawan'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('outlet', null)
            ->where('employees', [])
        );
});

it('denies access to the employee management page for non-owner roles', function () {
    $outlet = createOutlet();
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $plainUser = User::factory()->create();

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($admin)->get(route('kelola_karyawan'))->assertForbidden();
    $this->actingAs($kasir)->get(route('kelola_karyawan'))->assertForbidden();
    $this->actingAs($plainUser)->get(route('kelola_karyawan'))->assertForbidden();
});

it('allows the owner to change an employee role in their outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($owner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $kasir]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($kasir->hasOutletRole($outlet, 'admin outlet'))->toBeTrue();
    expect($kasir->hasRole('admin outlet'))->toBeTrue();
    expect($kasir->hasRole('kasir'))->toBeFalse();
});

it('keeps a global role when the employee still holds it in another outlet', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $kasir = attachUserToOutlet($kasir, $otherOutlet, 'kasir');

    $this->actingAs($owner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $kasir]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertRedirect();

    expect($kasir->hasRole('kasir'))->toBeTrue();
    expect($kasir->hasRole('admin outlet'))->toBeTrue();
});

it('does not allow changing the role of the owner', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $owner]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('role_id');
});

it('rejects changing the role of an employee not registered in the outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $outsider = createUserWithGlobalRole('kasir');

    $this->actingAs($owner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $outsider]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('role_id');
});

it('rejects invalid roles when updating an employee', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($owner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $kasir]), [
            'role_id' => roleId('owner outlet'),
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('role_id');
});

it('denies non-owners and owners of other outlets from changing an employee role', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $otherOwner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $otherOutlet, 'owner outlet');
    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');
    $admin = attachUserToOutlet(createUserWithGlobalRole('admin outlet'), $outlet, 'admin outlet');

    $this->actingAs($otherOwner)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $kasir]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertForbidden();

    $this->actingAs($admin)
        ->put(route('kelola_karyawan.update_role', ['outlet' => $outlet, 'user' => $kasir]), [
            'role_id' => roleId('admin outlet'),
        ])
        ->assertForbidden();
});

function createKaryawanPendingRequest(User $staff, User $owner, int $roleId, $outlet): RequestRole
{
    return RequestRole::create([
        'user_id' => $staff->id,
        'owner_id' => $owner->id,
        'role_id' => $roleId,
        'outlet_id' => $outlet->id,
        'status' => 'pending',
    ]);
}
