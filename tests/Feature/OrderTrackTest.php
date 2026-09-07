<?php

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

function createTrackBuyer(Company $company): User
{
    $buyer = User::factory()->create();

    return tap($buyer, fn (User $user) => $user->update(['company_id' => $company->id]));
}

function createTrackOrder(User $buyer, array $attributes = []): Order
{
    return Order::create(array_merge([
        'order_number' => 'ORD-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => $buyer->id,
        'status' => 'awaiting_payment',
        'subtotal' => 100000,
        'shipping_cost' => 15000,
        'discount' => 0,
        'tax' => 11000,
        'total' => 126000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jl. Merdeka No. 1, Jakarta',
        'courier' => 'jne',
        'tracking_number' => 'JNE1234567890',
    ], $attributes));
}

it('forbids another user from viewing the order timeline', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer);

    $intruder = createTrackBuyer($company);

    $this->actingAs($intruder)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertForbidden();
});

it('shows only the created step for an awaiting payment order', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer);

    $this->actingAs($buyer)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->has('order.timeline', 1)
            ->where('order.timeline.0.key', 'dipesan')
            ->where('order.timeline.0.reached', true));
});

it('shows the full timeline in order for a completed order', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer, [
        'status' => 'completed',
        'paid_at' => Carbon::parse('2026-01-02 08:00:00'),
        'shipped_at' => Carbon::parse('2026-01-03 09:30:00'),
        'completed_at' => Carbon::parse('2026-01-05 10:00:00'),
        'created_at' => Carbon::parse('2026-01-01 08:00:00'),
    ]);

    $this->actingAs($buyer)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where('order.timeline.0.key', 'dipesan')
            ->where('order.timeline.1.key', 'dibayar')
            ->where('order.timeline.2.key', 'diproses')
            ->where('order.timeline.3.key', 'dikirim')
            ->where('order.timeline.4.key', 'selesai')
            ->where('order.timeline.4.reached', true));
});

it('ends the timeline with the cancelled step for a cancelled order', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer, [
        'status' => 'cancelled',
        'cancelled_at' => Carbon::parse('2026-01-02 11:00:00'),
    ]);

    $this->actingAs($buyer)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->has('order.timeline', 2)
            ->where('order.timeline.1.key', 'dibatalkan')
            ->where('order.timeline.1.reached', true));
});

it('calculates the estimated delivery from the paid date', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer, [
        'status' => 'paid',
        'paid_at' => Carbon::parse('2026-02-10 08:00:00'),
    ]);

    $this->actingAs($buyer)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where(
                'order.estimated_delivery_at',
                Carbon::parse('2026-02-10 08:00:00')
                    ->addDays((int) config('shipping.estimated_days'))
                    ->toISOString(),
            ));
});

it('exposes courier, tracking number and shipping address on the tracking view', function () {
    $company = Company::factory()->create();
    $buyer = createTrackBuyer($company);
    $order = createTrackOrder($buyer, ['status' => 'shipped', 'shipped_at' => now()]);

    $this->actingAs($buyer)
        ->get(route('orders.show', ['order' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where('order.courier', 'jne')
            ->where('order.tracking_number', 'JNE1234567890')
            ->where('order.shipping_address', 'Jl. Merdeka No. 1, Jakarta'));
});
