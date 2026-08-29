<?php

namespace App\Services;

use App\Mail\OrderConfirmedMail;
use App\Mail\OrderShippedMail;
use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\KeranjangBelanjaKasir;
use App\Models\KeranjangBelanjaUser;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\User;
use App\Notifications\NewOrderNotification;
use App\Notifications\OrderStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        protected CouponService $coupons,
        protected LoyaltyService $loyalty,
        protected NotificationService $notifications,
        protected TenantService $tenants,
        protected UsageMeteringService $metering,
    ) {}

    /**
     * Create an order from the user's pending cart items.
     */
    public function createFromCart(
        int $userId,
        ?string $shippingAddress = null,
        ?string $notes = null,
        ?string $paymentMethod = null,
        float $shippingCost = 0,
        ?string $courier = null,
        ?string $couponCode = null,
        int $points = 0,
    ): Order {
        return DB::transaction(function () use ($userId, $shippingAddress, $notes, $paymentMethod, $shippingCost, $courier, $couponCode, $points) {
            $cartItems = KeranjangBelanjaUser::query()
                ->where('id_user', $userId)
                ->where('status', 'pending')
                ->with('produk:id,id_outlet,nama_produk,harga,harga_diskon,stok', 'variant:id,produk_id,nama,sku,harga,stok')
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Keranjang belanja kosong.',
                ]);
            }

            $subtotal = 0;
            $outletId = null;
            $orderItems = [];

            foreach ($cartItems as $cartItem) {
                $produk = $cartItem->produk;
                $variant = $cartItem->variant;

                if (! $produk) {
                    throw ValidationException::withMessages([
                        'cart' => "Produk untuk item keranjang #{$cartItem->id} tidak ditemukan.",
                    ]);
                }

                $usableStock = $variant !== null ? $variant->stok : $produk->stok;

                if ($usableStock < $cartItem->jumlah_produk) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok produk \"{$produk->nama_produk}\" tidak mencukupi. Tersisa {$usableStock}.",
                    ]);
                }

                if ($outletId === null) {
                    $outletId = $produk->id_outlet;
                } elseif ($produk->id_outlet !== $outletId) {
                    throw ValidationException::withMessages([
                        'cart' => 'Semua produk dalam satu pesanan harus dari outlet yang sama.',
                    ]);
                }

                $price = (float) ($variant?->harga ?? $produk->harga_diskon ?? $produk->harga);
                $itemSubtotal = $price * $cartItem->jumlah_produk;
                $subtotal += $itemSubtotal;

                $orderItems[] = [
                    'produk_id' => $produk->id,
                    'variant_id' => $variant?->id,
                    'variant_name' => $variant?->nama,
                    'product_name' => $produk->nama_produk,
                    'price' => $price,
                    'quantity' => $cartItem->jumlah_produk,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $user = auth()->user() ?? User::find($userId);
            $company = app(TenantService::class)->resolveForUser($user);
            abort_unless($company !== null, 422, 'Tenant tidak ditemukan.');

            $customer = $this->resolveCustomer($user, $company, $outletId);

            $couponDiscount = 0;
            $coupon = null;

            if ($couponCode) {
                $coupon = $this->coupons->find($couponCode, $company);
                $couponDiscount = (float) $this->coupons->discountFor($couponCode, $company, $subtotal, $outletId);
            }

            $pointsUsed = 0;
            $pointsDiscount = 0;

            if ($points > 0) {
                $pointsDiscount = (float) $this->loyalty->redeem($customer->id, $points, $subtotal + $shippingCost - $couponDiscount);
                $pointsUsed = $points;
            }

            $discount = $couponDiscount + $pointsDiscount;
            $taxable = $subtotal - $discount;
            $tax = round($taxable * 0.11, 2);
            $total = $taxable + $tax + $shippingCost;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $userId,
                'customer_id' => $customer->id,
                'outlet_id' => $outletId,
                'status' => 'awaiting_payment',
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'discount' => $discount,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'coupon_discount' => $couponDiscount,
                'points_used' => $pointsUsed,
                'points_discount' => $pointsDiscount,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'courier' => $courier,
                'shipping_address' => $shippingAddress,
                'notes' => $notes,
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            foreach ($cartItems as $cartItem) {
                if ($cartItem->variant) {
                    $cartItem->variant->decrement('stok', $cartItem->jumlah_produk);
                } else {
                    $cartItem->produk->decrement('stok', $cartItem->jumlah_produk);
                }
                $cartItem->update(['status' => 'done']);
            }

            if ($coupon !== null) {
                $this->coupons->recordUsage($coupon);
            }

            if ($pointsUsed > 0) {
                $this->loyalty->applyRedemption($customer, $order, $pointsUsed, $pointsDiscount);
            }

            $order->load('items.produk');

            try {
                Mail::to($order->user->email)->send(new OrderConfirmedMail($order));
            } catch (\Exception $e) {
                Log::error("Failed to send order confirmed email: {$e->getMessage()}");
            }

            try {
                $this->notifications->notifyCompanyStaff($company, new NewOrderNotification($order));
            } catch (\Exception $e) {
                Log::error("Failed to notify company staff: {$e->getMessage()}");
            }

            $this->notifyLowStockProducts();

            $this->metering->recordOrder($order);

            return $order;
        });
    }

    /**
     * Find or create the customer record linked to the ordering user.
     */
    private function resolveCustomer(User $user, Company $company, int $outletId): Customer
    {
        $customer = Customer::query()
            ->where('company_id', $company->id)
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('email', $user->email))
            ->first();

        if ($customer === null) {
            $customer = Customer::create([
                'company_id' => $company->id,
                'outlet_id' => $outletId,
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
        }

        return $customer;
    }

    /**
     * Create an order from the cashier's pending cart (offline sale).
     */
    public function createFromKasirCart(
        int $userId,
        int $outletId,
        ?int $customerId = null,
        ?string $couponCode = null,
        int $points = 0,
        ?string $paymentMethod = 'cash',
    ): Order {
        return DB::transaction(function () use ($userId, $outletId, $customerId, $couponCode, $points, $paymentMethod) {
            $cartItems = KeranjangBelanjaKasir::query()
                ->where('id_user', $userId)
                ->where('status', 'pending')
                ->with('produk:id,id_outlet,nama_produk,harga,harga_diskon,stok', 'variant:id,produk_id,nama,sku,harga,stok', 'customer')
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Keranjang kasir kosong.',
                ]);
            }

            $subtotal = 0;
            $orderItems = [];

            foreach ($cartItems as $cartItem) {
                $produk = $cartItem->produk;
                $variant = $cartItem->variant;

                if ($produk === null) {
                    throw ValidationException::withMessages([
                        'cart' => 'Ulangi kasir: keranjang berisi produk yang sudah dihapus.',
                    ]);
                }

                if ($produk->id_outlet !== $outletId) {
                    throw ValidationException::withMessages([
                        'cart' => 'Semua produk harus dari outlet yang sama dengan transaksi.',
                    ]);
                }

                $stock = $variant?->stok ?? $produk->stok;

                if ($stock < $cartItem->jumlah_produk) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok \"{$produk->nama_produk}\" tidak mencukupi. Tersisa {$stock}.",
                    ]);
                }

                $price = (float) ($variant?->harga ?? $produk->harga_diskon ?? $produk->harga);
                $subtotal += $price * $cartItem->jumlah_produk;

                $orderItems[] = [
                    'produk_id' => $produk->id,
                    'variant_id' => $variant?->id,
                    'variant_name' => $variant?->nama,
                    'product_name' => $variant?->nama
                        ? "{$produk->nama_produk} - {$variant->nama}"
                        : $produk->nama_produk,
                    'price' => $price,
                    'quantity' => $cartItem->jumlah_produk,
                    'subtotal' => $price * $cartItem->jumlah_produk,
                ];
            }

            $user = User::find($userId);
            $company = $this->companyOfOutlet($outletId);

            $selectedCustomerId = $cartItems->firstWhere('customer_id', '!=', null)?->customer_id
                ?? (isset($customerId) ? $customerId : null);

            $couponDiscount = 0;
            $coupon = null;

            if ($couponCode && $company !== null) {
                $coupon = $this->coupons->find($couponCode, $company);
                $couponDiscount = (float) $this->coupons->discountFor($couponCode, $company, $subtotal, $outletId);
            }

            $pointsUsed = 0;
            $pointsDiscount = 0;

            if ($points > 0 && $selectedCustomerId !== null) {
                $pointsDiscount = (float) $this->loyalty->redeem($selectedCustomerId, $points, $subtotal - $couponDiscount);
                $pointsUsed = $points;
            }

            $discount = $couponDiscount + $pointsDiscount;
            $taxable = $subtotal - $discount;
            $tax = round($taxable * 0.11, 2);
            $total = $taxable + $tax;

            $order = Order::create([
                'order_number' => 'CT-'.date('YmdHis').'-'.random_int(100, 999),
                'user_id' => $userId,
                'customer_id' => $selectedCustomerId,
                'outlet_id' => $outletId,
                'status' => 'completed',
                'subtotal' => $subtotal,
                'shipping_cost' => 0,
                'discount' => $discount,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'coupon_discount' => $couponDiscount,
                'points_used' => $pointsUsed,
                'points_discount' => $pointsDiscount,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'paid_at' => now(),
                'completed_at' => now(),
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            foreach ($cartItems as $cartItem) {
                if ($cartItem->variant) {
                    $cartItem->variant->decrement('stok', $cartItem->jumlah_produk);
                } else {
                    $cartItem->produk->decrement('stok', $cartItem->jumlah_produk);
                }
                $cartItem->update(['status' => 'done']);
            }

            if ($coupon !== null) {
                $this->coupons->recordUsage($coupon);
            }

            if ($pointsUsed > 0) {
                $this->loyalty->applyRedemption($order->customer, $order, $pointsUsed, $pointsDiscount);
            }

            try {
                $this->loyalty->award($order);
            } catch (\Exception $e) {
                Log::error("Failed to award loyalty points: {$e->getMessage()}");
            }

            try {
                $this->notifications->notifyCompanyStaff($order->outlet?->company, new OrderStatusNotification($order));
            } catch (\Exception $e) {
                Log::error("Failed to notify company staff: {$e->getMessage()}");
            }

            $this->notifyLowStockProducts();

            $this->metering->recordOrder($order);

            return $order;
        });
    }

    private function companyOfOutlet(int $outletId): ?Company
    {
        return Outlet::query()->with('company')->find($outletId)?->company;
    }

    /**
     * Scan for newly low-stock products and notify owners/admins.
     */
    private function notifyLowStockProducts(): void
    {
        try {
            $products = Produk::query()
                ->where('min_stok', '>', 0)
                ->with('variants', 'outlet.company')
                ->get();

            foreach ($products as $produk) {
                $this->notifications->notifyLowStock($produk);
            }
        } catch (\Exception $e) {
            Log::error("Failed to check low stock notifications: {$e->getMessage()}");
        }
    }

    /**
     * Send email notification for an order status change.
     */
    private function sendNotificationEmails(Order $order, string $newStatus): void
    {
        try {
            match ($newStatus) {
                'shipped' => Mail::to($order->user->email)->send(new OrderShippedMail($order)),
                default => null,
            };
        } catch (\Exception $e) {
            Log::error("Failed to send order email for status '{$newStatus}': {$e->getMessage()}");
        }
    }

    /**
     * Transition an order to a new status.
     */
    public function transitionStatus(Order $order, string $newStatus): Order
    {
        $allowed = $this->allowedTransitions($order->status);

        if (! in_array($newStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => "Transisi dari \"{$order->status}\" ke \"{$newStatus}\" tidak diizinkan.",
            ]);
        }

        $updates = ['status' => $newStatus];

        if ($newStatus === 'paid') {
            $updates['paid_at'] = now();
        } elseif ($newStatus === 'shipped') {
            $updates['shipped_at'] = now();
        } elseif ($newStatus === 'completed') {
            $updates['completed_at'] = now();
        } elseif ($newStatus === 'cancelled') {
            $updates['cancelled_at'] = now();
            $this->restoreStock($order);
            $this->restoreCouponQuota($order);
            $this->restoreRedeemedPoints($order);
        } elseif ($newStatus === 'expired') {
            $this->restoreStock($order);
            $this->restoreRedeemedPoints($order);
        }

        $order->update($updates);

        if ($newStatus === 'completed') {
            try {
                $this->loyalty->award($order);
            } catch (\Exception $e) {
                Log::error("Failed to award loyalty points: {$e->getMessage()}");
            }
        }

        $this->sendNotificationEmails($order, $newStatus);

        try {
            $this->notifications->notifyCompanyStaff($order->outlet?->company, new OrderStatusNotification($order));
            $order->user?->notify(new OrderStatusNotification($order));
        } catch (\Exception $e) {
            Log::error("Failed to send order status notification: {$e->getMessage()}");
        }

        return $order->fresh();
    }

    /**
     * Get the allowed status transitions for a given status.
     *
     * @return list<string>
     */
    public function allowedTransitions(string $currentStatus): array
    {
        return match ($currentStatus) {
            'pending' => ['awaiting_payment', 'cancelled'],
            'awaiting_payment' => ['paid', 'cancelled', 'expired'],
            'paid' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['completed'],
            'completed' => [],
            'cancelled' => [],
            'expired' => [],
            default => [],
        };
    }

    /**
     * Restore stock for all items in the order, respecting variants.
     */
    private function restoreStock(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if ($item->variant_id !== null) {
                ProductVariant::where('id', $item->variant_id)
                    ->increment('stok', $item->quantity);
            } else {
                Produk::where('id', $item->produk_id)
                    ->increment('stok', $item->quantity);
            }
        }

        $this->notifyLowStockProducts();
    }

    /**
     * Release a used coupon quota when the order is cancelled.
     */
    private function restoreCouponQuota(Order $order): void
    {
        if ($order->coupon_id === null) {
            return;
        }

        Coupon::where('id', $order->coupon_id)
            ->where('used_count', '>', 0)
            ->decrement('used_count');
    }

    /**
     * Return redeemed points to the customer when the order is cancelled.
     */
    private function restoreRedeemedPoints(Order $order): void
    {
        if ($order->points_used <= 0 || $order->customer_id === null) {
            return;
        }

        $customer = $order->customer;

        if ($customer === null) {
            return;
        }

        $customer->increment('points', $order->points_used);

        $customer->loyaltyTransactions()->create([
            'company_id' => $order->outlet?->company_id ?? $customer->company_id,
            'order_id' => $order->id,
            'type' => LoyaltyTransaction::TYPE_ADJUST,
            'points' => $order->points_used,
            'description' => "Pengembalian poin karena pesanan {$order->order_number} dibatalkan",
        ]);
    }
}
