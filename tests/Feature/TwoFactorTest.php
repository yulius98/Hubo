<?php

use App\Models\CompanySetting;
use App\Models\Role;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * RFC 6238 test vector: ASCII secret "12345678901234567890" generates the
 * 8-digit code 94287082 at T=59 (counter 1), so the 6-digit code is 287082.
 */
$rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

it('verifies TOTP codes against the RFC 6238 test vector', function () use ($rfcSecret) {
    Carbon::setTestNow(Carbon::parse('1970-01-01 00:00:59'));

    $service = app(TwoFactorService::class);

    expect($service->valid($rfcSecret, '287082'))->toBeTrue()
        ->and($service->valid($rfcSecret, '000000'))->toBeFalse()
        ->and($service->valid($rfcSecret, 'abc123'))->toBeFalse();
});

it('requires authentication to reach the security settings page', function () {
    $this->get(route('settings.security'))->assertRedirect(route('login'));
});

it('runs the owner through the full enable/confirm flow and mints recovery codes', function () {
    seedRoles();
    $outlet = createOutlet();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->outlets()->attach($outlet->id, ['role_id' => Role::where('role', 'owner outlet')->firstOrFail()->id]);
    $owner->update(['company_id' => $outlet->company_id]);

    $this->actingAs($owner)
        ->get(route('settings.security'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/security')
            ->where('enabled', false)
            ->where('pending_secret', null));

    $this->actingAs($owner)
        ->post(route('settings.security.enable'))
        ->assertRedirect(route('settings.security'));

    $owner->refresh();

    expect($owner->two_factor_secret)->not->toBeNull()
        ->and($owner->two_factor_enabled_at)->toBeNull();

    $this->actingAs($owner)
        ->get(route('settings.security'))
        ->assertInertia(fn (Assert $page) => $page->where('pending_secret', $owner->two_factor_secret));

    $this->actingAs($owner)
        ->post(route('settings.security.confirm'), ['code' => '000000'])
        ->assertSessionHasErrors('code');

    $validCode = app(TwoFactorService::class)->codeFor($owner->two_factor_secret);

    $this->actingAs($owner)
        ->post(route('settings.security.confirm'), ['code' => $validCode])
        ->assertRedirect(route('settings.security'));

    $recoveryCodes = session('two_fa_recovery_codes');

    expect($recoveryCodes)->toHaveCount(10);

    $owner->refresh();

    expect($owner->two_factor_enabled_at)->not->toBeNull()
        ->and(json_decode((string) $owner->two_factor_recovery_codes, true))->toHaveCount(10);

    $this->actingAs($owner)
        ->get(route('settings.security'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enabled', true)
            ->where('recovery_codes', $recoveryCodes));
});

it('blocks an owner without 2FA when the tenant policy enforces it', function () {
    seedRoles();
    $outlet = createOutlet();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->outlets()->attach($outlet->id, ['role_id' => Role::where('role', 'owner outlet')->firstOrFail()->id]);
    $owner->update(['company_id' => $outlet->company_id]);

    CompanySetting::set($outlet->company_id, CompanySetting::KEY_TWO_FA_REQUIRED, '1');

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertRedirect(route('settings.security'));

    $secret = app(TwoFactorService::class)->beginEnable($owner);
    $codes = app(TwoFactorService::class)->confirm($owner, app(TwoFactorService::class)->codeFor($secret));

    expect($codes)->toHaveCount(10);

    $this->actingAs($owner)
        ->get(route('dashboard'))
        ->assertOk();
});

it('does not block a staff member when the tenant policy is active', function () {
    seedRoles();
    $outlet = createOutlet();
    $kasir = createUserWithGlobalRole('kasir');
    $kasir->outlets()->attach($outlet->id, ['role_id' => Role::where('role', 'kasir')->firstOrFail()->id]);
    $kasir->update(['company_id' => $outlet->company_id]);

    CompanySetting::set($outlet->company_id, CompanySetting::KEY_TWO_FA_REQUIRED, '1');

    $this->actingAs($kasir)
        ->get(route('dashboard'))
        ->assertOk();
});

it('disables two-factor again using a recovery code', function () {
    seedRoles();
    $user = User::factory()->create();
    $secret = app(TwoFactorService::class)->beginEnable($user);
    $recoveryCodes = app(TwoFactorService::class)->confirm($user, app(TwoFactorService::class)->codeFor($secret));

    expect($recoveryCodes)->toHaveCount(10);

    $this->actingAs($user)
        ->post(route('settings.security.disable'), ['code' => $recoveryCodes[0]])
        ->assertRedirect(route('settings.security'));

    $user->refresh();

    expect($user->two_factor_enabled_at)->toBeNull()
        ->and($user->two_factor_secret)->toBeNull()
        ->and($user->two_factor_recovery_codes)->toBeNull();
});

it('lets the owner toggle the enforcement policy but not staff', function () {
    seedRoles();
    $outlet = createOutlet();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->outlets()->attach($outlet->id, ['role_id' => Role::where('role', 'owner outlet')->firstOrFail()->id]);
    $owner->update(['company_id' => $outlet->company_id]);

    $this->actingAs($owner)
        ->put(route('settings.security.policy'), ['two_fa_required' => '1'])
        ->assertRedirect();

    expect(CompanySetting::get($outlet->company_id, CompanySetting::KEY_TWO_FA_REQUIRED))->toBe('1');

    $kasir = createUserWithGlobalRole('kasir');
    $kasir->update(['company_id' => $outlet->company_id]);

    $this->actingAs($kasir)
        ->put(route('settings.security.policy'), ['two_fa_required' => '0'])
        ->assertForbidden();
});

it('forbids a super admin without a tenant from setting the policy', function () {
    seedRoles();
    $admin = createUserWithGlobalRole('super admin');

    $this->actingAs($admin)
        ->put(route('settings.security.policy'), ['two_fa_required' => '1'])
        ->assertForbidden();
});
