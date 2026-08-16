<?php

use App\Models\User;

beforeEach(function () {
    seedRoles();
});

it('blocks a super admin from the request staff page', function () {
    $superAdmin = createUserWithGlobalRole('super admin');

    $this->actingAs($superAdmin)
        ->get(route('req_staff'))
        ->assertForbidden();
});

it('blocks a super admin from submitting a staff request', function () {
    $superAdmin = createUserWithGlobalRole('super admin');

    $this->actingAs($superAdmin)
        ->post(route('req_staff.add'), [])
        ->assertForbidden();
});

it('keeps the request staff page open for regular users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('req_staff'))
        ->assertOk();
});

it('keeps the request staff page open for kasir users', function () {
    $kasir = createUserWithGlobalRole('kasir');

    $this->actingAs($kasir)
        ->get(route('req_staff'))
        ->assertOk();
});

it('keeps the request staff page open for owners', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(
        createUserWithGlobalRole('owner outlet'),
        $outlet,
        'owner outlet',
    );

    $this->actingAs($owner)
        ->get(route('req_staff'))
        ->assertOk();
});
