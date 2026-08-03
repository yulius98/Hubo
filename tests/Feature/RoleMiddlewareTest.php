<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

it('allows a user holding the required global role', function () {
    Route::middleware(['web', 'auth', 'role:owner outlet'])
        ->get('/_test/role-middleware-allow', fn () => 'ok');

    $user = createUserWithGlobalRole('owner outlet');

    $this->actingAs($user)->get('/_test/role-middleware-allow')->assertOk();
});

it('denies a user without the required global role', function () {
    Route::middleware(['web', 'auth', 'role:owner outlet'])
        ->get('/_test/role-middleware-deny', fn () => 'ok');

    $user = User::factory()->create();

    $this->actingAs($user)->get('/_test/role-middleware-deny')->assertForbidden();
});

it('validates the role against the given outlet', function () {
    $outlet = createOutlet();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner = attachUserToOutlet($owner, $outlet, 'owner outlet');

    Route::middleware(['web', 'auth', 'role:owner outlet,outlet:'.$outlet->id])
        ->get('/_test/role-middleware-outlet', fn () => 'ok');

    $this->actingAs($owner)->get('/_test/role-middleware-outlet')->assertOk();

    $otherOwner = createUserWithGlobalRole('owner outlet');

    $this->actingAs($otherOwner)->get('/_test/role-middleware-outlet')->assertForbidden();
});
