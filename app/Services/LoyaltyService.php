<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class LoyaltyService
{
    /**
     * 1 point earned for every 1000 IDR spent.
     */
    public const EARN_FACTOR = 1000;

    /**
     * Monetary value of a single point in IDR.
     */
    public const POINT_VALUE = 100;

    /**
     * Minimum number of points a customer may redeem per order.
     */
    public const MIN_REDEEM = 100;

    /**
     * The points a completed order earns for its customer.
     */
    public function pointsFor(Order $order): int
    {
        return (int) floor(((float) $order->total - (float) $order->shipping_cost) / self::EARN_FACTOR);
    }

    /**
     * Award points to the order's customer when the order is completed.
     */
    public function award(Order $order): ?Customer
    {
        if ($order->customer_id === null) {
            return null;
        }

        $points = $this->pointsFor($order);

        if ($points <= 0) {
            return null;
        }

        $customer = $order->customer;

        $customer->increment('points', $points);
        $customer->increment('total_spent', (float) $order->total);

        $customer->loyaltyTransactions()->create([
            'company_id' => $order->outlet?->company_id ?? $customer->company_id,
            'order_id' => $order->id,
            'type' => LoyaltyTransaction::TYPE_EARN,
            'points' => $points,
            'description' => "Poin dari pesanan {$order->order_number}",
        ]);

        return $customer;
    }

    /**
     * Compute the maximum redeemable points for a given order cost.
     */
    public function maxRedeemable(int $balance, float $orderCost): int
    {
        $affordable = (int) floor($orderCost / self::POINT_VALUE);

        return max(0, min($balance, $affordable));
    }

    /**
     * Redeem points on an order: returns the points discount amount.
     */
    public function redeem(int $customerId, int $points, float $orderCost): float
    {
        $customer = Customer::findOrFail($customerId);

        if ($points < self::MIN_REDEEM) {
            throw ValidationException::withMessages([
                'points' => 'Minimal penukaran poin adalah '.self::MIN_REDEEM.' poin.',
            ]);
        }

        if ($points > $customer->points) {
            throw ValidationException::withMessages([
                'points' => "Saldo poin tidak mencukupi. Saldo Anda: {$customer->points} poin.",
            ]);
        }

        $discount = $points * self::POINT_VALUE;

        if ($discount > $orderCost) {
            throw ValidationException::withMessages([
                'points' => 'Nilai poin melebihi total belanja.',
            ]);
        }

        return (float) $discount;
    }

    /**
     * Apply a redemption transaction after the order is created.
     */
    public function applyRedemption(Customer $customer, Order $order, int $points, float $discount): void
    {
        $customer->decrement('points', $points);

        $customer->loyaltyTransactions()->create([
            'company_id' => $order->outlet?->company_id ?? $customer->company_id,
            'order_id' => $order->id,
            'type' => LoyaltyTransaction::TYPE_REDEEM,
            'points' => -$points,
            'description' => "Penukaran poin pada pesanan {$order->order_number}",
        ]);
    }
}
