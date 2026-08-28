<?php

use App\Models\Company;
use App\Models\Coupon;
use App\Services\CouponService;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->outlet = createOutlet();
    $this->company = Company::factory()->create();
    $this->outlet->update(['company_id' => $this->company->id]);
    $this->owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $this->outlet, 'owner outlet');
});

it('lists coupons for the company', function () {
    Coupon::factory()->create(['company_id' => $this->company->id, 'outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)
        ->get(route('coupons'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/coupons')
            ->has('coupons.data', 1));
});

it('creates a coupon and uppercases its code', function () {
    $this->actingAs($this->owner)
        ->post(route('coupons.add'), [
            'code' => 'gratis10',
            'name' => 'Diskon 10%',
            'type' => 'percentage',
            'value' => 10,
            'min_purchase' => 50000,
            'max_discount' => 20000,
            'outlet_id' => $this->outlet->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('coupons', [
        'company_id' => $this->company->id,
        'code' => 'GRATIS10',
        'type' => 'percentage',
        'value' => 10,
    ]);
});

it('prevents creating a coupon with a duplicate code within the company', function () {
    Coupon::factory()->create(['company_id' => $this->company->id, 'code' => 'DUP']);

    $this->actingAs($this->owner)
        ->post(route('coupons.add'), [
            'code' => 'DUP',
            'name' => 'Kupon',
            'type' => 'fixed',
            'value' => 10000,
            'min_purchase' => 0,
        ])
        ->assertSessionHasErrors('code');

    expect(Coupon::count())->toBe(1);
});

it('rejects a coupon code with invalid characters', function () {
    $this->actingAs($this->owner)
        ->post(route('coupons.add'), [
            'code' => 'SALAH KODE!',
            'name' => 'Kupon',
            'type' => 'fixed',
            'value' => 10000,
            'min_purchase' => 0,
        ])
        ->assertSessionHasErrors('code');
});

it('toggles coupon active state', function () {
    $coupon = Coupon::factory()->create(['company_id' => $this->company->id]);

    $this->actingAs($this->owner)
        ->post(route('coupons.toggle', $coupon))
        ->assertRedirect();

    expect($coupon->fresh()->is_active)->toBeFalse();
});

it('deletes a coupon', function () {
    $coupon = Coupon::factory()->create(['company_id' => $this->company->id]);

    $this->actingAs($this->owner)
        ->delete(route('coupons.delete', $coupon))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Coupon::find($coupon->id))->toBeNull();
});

it('forbids managing coupons of another company', function () {
    $otherCoupon = Coupon::factory()->create(['company_id' => Company::factory()->create()->id]);

    $this->actingAs($this->owner)
        ->put(route('coupons.update', $otherCoupon), [
            'code' => 'HACK',
            'name' => 'Hack',
            'type' => 'fixed',
            'value' => 1,
            'min_purchase' => 0,
        ])
        ->assertForbidden();
});

it('computes a percentage discount respecting the max discount cap', function () {
    $coupon = Coupon::factory()->create([
        'company_id' => $this->company->id,
        'type' => 'percentage',
        'value' => 20,
        'max_discount' => 15000,
        'min_purchase' => 0,
        'valid_from' => now()->subDay(),
        'valid_to' => now()->addMonth(),
        'is_active' => true,
    ]);

    $service = app(CouponService::class);

    expect($service->discountFor($coupon->code, $this->company, 100000, $this->outlet->id))->toBe(15000.0);
    expect($service->discountFor($coupon->code, $this->company, 50000, $this->outlet->id))->toBe(10000.0);
});

it('computes a fixed discount that never exceeds the subtotal', function () {
    $coupon = Coupon::factory()->fixed(30000)->create([
        'company_id' => $this->company->id,
        'min_purchase' => 0,
        'valid_from' => now()->subDay(),
        'valid_to' => now()->addMonth(),
    ]);

    $service = app(CouponService::class);

    expect($service->discountFor($coupon->code, $this->company, 20000, $this->outlet->id))->toBe(20000.0);
});

it('rejects a coupon when the subtotal is below the minimum purchase', function () {
    Coupon::factory()->create([
        'company_id' => $this->company->id,
        'type' => 'fixed',
        'value' => 5000,
        'min_purchase' => 100000,
        'valid_from' => now()->subDay(),
        'valid_to' => now()->addMonth(),
    ]);

    $service = app(CouponService::class);
    $service->discountFor(Coupon::latest('id')->first()->code, $this->company, 50000, $this->outlet->id);
})->throws(ValidationException::class);
