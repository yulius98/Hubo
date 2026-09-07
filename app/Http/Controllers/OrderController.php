<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display the user's order history.
     */
    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->forUser($request->user()->id)
            ->with('items')
            ->latest()
            ->paginate(10);

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Display the specified order detail.
     */
    public function returnCreate(Request $request, Order $order): Response
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        abort_unless(in_array($order->status, ['shipped', 'completed']), 403);

        $order->load('items.produk');

        return Inertia::render('orders/return-create', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'total' => $order->total,
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                    'gambar' => $item->produk?->gambar,
                ]),
            ],
        ]);
    }

    /**
     * Display the specified order detail.
     */
    public function show(Request $request, Order $order): Response
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        $order->load(['items.produk', 'payment', 'returns']);

        $status = $order->status;

        $relativeTimeline = [
            [
                'key' => 'dipesan',
                'label' => 'Pesanan Dibuat',
                'time' => $order->created_at?->toISOString(),
                'reached' => true,
            ],
            [
                'key' => 'dibayar',
                'label' => 'Pembayaran Dikonfirmasi',
                'time' => $order->paid_at?->toISOString(),
                'reached' => $order->paid_at !== null,
            ],
            [
                'key' => 'diproses',
                'label' => 'Pesanan Diproses',
                'time' => $order->paid_at?->toISOString(),
                'reached' => in_array($status, ['processing', 'shipped', 'completed'], true),
            ],
            [
                'key' => 'dikirim',
                'label' => 'Pesanan Dikirim',
                'time' => $order->shipped_at?->toISOString(),
                'reached' => $order->shipped_at !== null,
            ],
            [
                'key' => 'selesai',
                'label' => 'Pesanan Selesai',
                'time' => $order->completed_at?->toISOString(),
                'reached' => $order->completed_at !== null,
            ],
        ];

        $timeline = collect($relativeTimeline)->filter(fn (array $step) => $step['reached']);

        if ($status === 'cancelled' || $status === 'expired') {
            $timeline->push([
                'key' => 'dibatalkan',
                'label' => 'Pesanan '.(strtolower($status) === 'cancelled' ? 'Dibatalkan' : 'Kedaluwarsa'),
                'time' => $order->cancelled_at?->toISOString(),
                'reached' => true,
            ]);
        }

        if ($order->returns->isNotEmpty()) {
            $timeline->push([
                'key' => 'pengembalian',
                'label' => 'Pengajuan Pengembalian',
                'time' => null,
                'reached' => true,
            ]);
        }

        $estimatedDeliveryAt = ($order->paid_at ?? $order->created_at)
            ?->copy()
            ->addDays((int) config('shipping.estimated_days'));

        return Inertia::render('orders/show', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'status_label' => $order->status_label,
                'status_color' => $order->status_color,
                'subtotal' => $order->subtotal,
                'shipping_cost' => $order->shipping_cost,
                'discount' => $order->discount,
                'tax' => $order->tax,
                'total' => $order->total,
                'payment_method' => $order->payment_method,
                'shipping_address' => $order->shipping_address,
                'notes' => $order->notes,
                'courier' => $order->courier,
                'tracking_number' => $order->tracking_number,
                'shipped_at' => $order->shipped_at?->toISOString(),
                'paid_at' => $order->paid_at?->toISOString(),
                'completed_at' => $order->completed_at?->toISOString(),
                'cancelled_at' => $order->cancelled_at?->toISOString(),
                'created_at' => $order->created_at->toISOString(),
                'estimated_delivery_at' => $estimatedDeliveryAt?->toISOString(),
                'timeline' => $timeline->values(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                    'gambar' => $item->produk?->gambar,
                ]),
                'payment' => $order->payment ? [
                    'payment_number' => $order->payment->payment_number,
                    'gateway' => $order->payment->gateway,
                    'status' => $order->payment->status,
                    'amount' => $order->payment->amount,
                    'paid_at' => $order->payment->paid_at?->toISOString(),
                ] : null,
                'returns' => $order->returns->map(fn ($return) => [
                    'id' => $return->id,
                    'return_number' => $return->return_number,
                    'status' => $return->status,
                ]),
            ],
        ]);
    }
}
