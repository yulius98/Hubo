<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function show(Request $request, Order $order): Response
    {
        abort_if($order->user_id !== $request->user()->id, 403);

        $order->load(['items.produk', 'payment', 'user', 'outlet']);

        return Inertia::render('orders/invoice', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'status_label' => $order->status_label,
                'subtotal' => $order->subtotal,
                'shipping_cost' => $order->shipping_cost,
                'discount' => $order->discount,
                'tax' => $order->tax,
                'total' => $order->total,
                'payment_method' => $order->payment_method,
                'shipping_address' => $order->shipping_address,
                'notes' => $order->notes,
                'paid_at' => $order->paid_at?->toISOString(),
                'created_at' => $order->created_at->toISOString(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                ]),
                'payment' => $order->payment ? [
                    'payment_number' => $order->payment->payment_number,
                    'gateway' => $order->payment->gateway,
                    'status' => $order->payment->status,
                    'amount' => $order->payment->amount,
                    'paid_at' => $order->payment->paid_at?->toISOString(),
                ] : null,
                'user' => [
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ],
                'outlet' => [
                    'nama_outlet' => $order->outlet?->nama_outlet ?? 'Hubo',
                ],
            ],
        ]);
    }
}
