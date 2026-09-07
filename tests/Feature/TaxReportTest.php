<?php

use App\Models\Company;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

function createTaxOrder(array $attributes = []): Order
{
    $createdAt = $attributes['created_at'] ?? Carbon::parse('2026-03-10 10:00:00');

    $order = Order::create(array_merge([
        'order_number' => 'ORD-TAX-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => User::factory()->create()->id,
        'status' => 'completed',
        'subtotal' => 900000,
        'shipping_cost' => 0,
        'discount' => 0,
        'tax' => 99000,
        'total' => 999000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jl. Pajak No. 1',
    ], $attributes));

    $order->forceFill(['created_at' => $createdAt])->save();

    return $order;
}

it('allows super admin to view the tax report', function () {
    $admin = createUserWithGlobalRole('super admin');

    $this->actingAs($admin)
        ->get(route('admin.reports.tax'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/tax-reports'));
});

it('sums the monthly PPN from non-excluded orders', function () {
    $admin = createUserWithGlobalRole('super admin');

    createTaxOrder(['created_at' => Carbon::parse('2026-03-05 09:00:00')]);
    createTaxOrder(['created_at' => Carbon::parse('2026-03-20 09:00:00'), 'tax' => 11000, 'total' => 111000, 'subtotal' => 100000]);
    createTaxOrder(['created_at' => Carbon::parse('2026-04-02 09:00:00')]);

    $this->actingAs($admin)
        ->get(route('admin.reports.tax', ['start_date' => '2026-03-01', 'end_date' => '2026-04-30']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/tax-reports')
            ->has('months', 2)
            ->where('months.0.month', '2026-03')
            ->where('months.0.tax_total', 110000)
            ->where('months.0.order_count', 2)
            ->where('months.1.month', '2026-04')
            ->where('months.1.tax_total', 99000)
            ->where('total_ppn', 209000)
            ->where('total_orders', 3));
});

it('excludes cancelled and expired orders from the PPN recap', function () {
    $admin = createUserWithGlobalRole('super admin');

    createTaxOrder(['created_at' => Carbon::parse('2026-03-05 09:00:00')]);
    createTaxOrder(['status' => 'cancelled', 'created_at' => Carbon::parse('2026-03-06 09:00:00')]);
    createTaxOrder(['status' => 'expired', 'created_at' => Carbon::parse('2026-03-07 09:00:00')]);

    $this->actingAs($admin)
        ->get(route('admin.reports.tax', ['start_date' => '2026-03-01', 'end_date' => '2026-03-31']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('total_orders', 1)
            ->where('total_ppn', 99000));
});

it('excludes refunded orders from the PPN recap', function () {
    $admin = createUserWithGlobalRole('super admin');

    $order = createTaxOrder(['created_at' => Carbon::parse('2026-03-05 09:00:00')]);

    OrderReturn::create([
        'company_id' => Company::factory()->create()->id,
        'order_id' => $order->id,
        'return_number' => 'RTN-'.fake()->unique()->numberBetween(1000, 9999),
        'reason' => 'Barang rusak',
        'status' => 'completed',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.reports.tax', ['start_date' => '2026-03-01', 'end_date' => '2026-03-31']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('total_orders', 0)
            ->where('total_ppn', 0));
});

it('filters the PPN recap by outlet', function () {
    $admin = createUserWithGlobalRole('super admin');

    $otherOutlet = createOutlet();
    createTaxOrder(['created_at' => Carbon::parse('2026-03-05 09:00:00'), 'outlet_id' => $otherOutlet->id]);

    $this->actingAs($admin)
        ->get(route('admin.reports.tax', ['start_date' => '2026-03-01', 'end_date' => '2026-03-31', 'outlet_id' => 999]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('total_orders', 0)
            ->where('total_ppn', 0));
});

it('exports the PPN recap as CSV', function () {
    $admin = createUserWithGlobalRole('super admin');

    createTaxOrder(['created_at' => Carbon::parse('2026-03-05 09:00:00')]);

    $response = $this->actingAs($admin)
        ->get(route('admin.reports.tax-export', ['start_date' => '2026-03-01', 'end_date' => '2026-03-31']))
        ->assertOk();

    $content = $response->streamedContent();
    expect($content)->toContain('2026-03');
    expect($content)->toContain('99000');
});

it('prevents non-admin users from accessing the tax report', function () {
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)
        ->get(route('admin.reports.tax'))
        ->assertForbidden();
});
