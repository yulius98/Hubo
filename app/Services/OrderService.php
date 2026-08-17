<?php

namespace App\Services;

use App\Mail\OrderConfirmedMail;
use App\Mail\OrderShippedMail;
use App\Models\KeranjangBelanjaUser;
use App\Models\Order;
use App\Models\Produk;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create an order from the user's pending cart items.
     */
    public function createFromCart(
        int $userId,
        ?string $shippingAddress = null,
        ?string $notes = null,
        ?string $paymentMethod = null,
    ): Order {
        return DB::transaction(function () use ($userId, $shippingAddress, $notes, $paymentMethod) {
            $cartItems = KeranjangBelanjaUser::query()
                ->where('id_user', $userId)
                ->where('status', 'pending')
                ->with('produk:id,id_outlet,nama_produk,harga,harga_diskon,stok')
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

                if (! $produk) {
                    throw ValidationException::withMessages([
                        'cart' => "Produk untuk item keranjang #{$cartItem->id} tidak ditemukan.",
                    ]);
                }

                if ($produk->stok < $cartItem->jumlah_produk) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok produk \"{$produk->nama_produk}\" tidak mencukupi. Tersisa {$produk->stok}.",
                    ]);
                }

                if ($outletId === null) {
                    $outletId = $produk->id_outlet;
                } elseif ($produk->id_outlet !== $outletId) {
                    throw ValidationException::withMessages([
                        'cart' => 'Semua produk dalam satu pesanan harus dari outlet yang sama.',
                    ]);
                }

                $price = (float) ($produk->harga_diskon ?? $produk->harga);
                $itemSubtotal = $price * $cartItem->jumlah_produk;
                $subtotal += $itemSubtotal;

                $orderItems[] = [
                    'produk_id' => $produk->id,
                    'product_name' => $produk->nama_produk,
                    'price' => $price,
                    'quantity' => $cartItem->jumlah_produk,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $tax = $subtotal * 0.11;
            $total = $subtotal + $tax;

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $userId,
                'outlet_id' => $outletId,
                'status' => 'awaiting_payment',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'shipping_address' => $shippingAddress,
                'notes' => $notes,
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            foreach ($cartItems as $cartItem) {
                $produk = $cartItem->produk;
                $produk->decrement('stok', $cartItem->jumlah_produk);
                $cartItem->update(['status' => 'done']);
            }

            $order->load('items.produk');

            try {
                Mail::to($order->user->email)->send(new OrderConfirmedMail($order));
            } catch (\Exception $e) {
                Log::error("Failed to send order confirmed email: {$e->getMessage()}");
            }

            return $order;
        });
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
        } elseif ($newStatus === 'completed') {
            $updates['completed_at'] = now();
        } elseif ($newStatus === 'cancelled') {
            $updates['cancelled_at'] = now();
            $this->restoreStock($order);
        } elseif ($newStatus === 'expired') {
            $this->restoreStock($order);
        }

        $order->update($updates);

        $this->sendNotificationEmails($order, $newStatus);

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
     * Restore stock for all items in the order.
     */
    private function restoreStock(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            Produk::where('id', $item->produk_id)
                ->increment('stok', $item->quantity);
        }
    }
}
