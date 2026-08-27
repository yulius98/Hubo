<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Payment;
use App\Models\Produk;
use App\Models\Transaksi;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnService
{
    /**
     * Request a return for an order.
     */
    public function requestReturn(Order $order, array $items, string $reason): OrderReturn
    {
        if (! in_array($order->status, ['shipped', 'completed'], true)) {
            throw ValidationException::withMessages([
                'order' => 'Pesanan harus dalam status dikirim atau selesai untuk melakukan retur.',
            ]);
        }

        $existingReturn = OrderReturn::where('order_id', $order->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingReturn) {
            throw ValidationException::withMessages([
                'order' => 'Pesanan ini sudah memiliki permintaan retur yang sedang diproses.',
            ]);
        }

        return DB::transaction(function () use ($order, $items, $reason) {
            $refundAmount = 0;

            foreach ($items as $item) {
                $orderItem = OrderItem::findOrFail($item['order_item_id']);

                if ($orderItem->order_id !== $order->id) {
                    throw ValidationException::withMessages([
                        'items' => 'Item tidak termasuk dalam pesanan ini.',
                    ]);
                }

                if ($item['quantity'] > $orderItem->quantity) {
                    throw ValidationException::withMessages([
                        'items' => 'Jumlah retur tidak boleh melebihi jumlah yang dipesan.',
                    ]);
                }

                $refundAmount += $orderItem->price * $item['quantity'];
            }

            $return = OrderReturn::create([
                'company_id' => $order->outlet?->company_id,
                'order_id' => $order->id,
                'return_number' => OrderReturn::generateReturnNumber(),
                'reason' => $reason,
                'status' => 'pending',
                'refund_amount' => $refundAmount,
            ]);

            foreach ($items as $item) {
                $return->items()->create([
                    'order_item_id' => $item['order_item_id'],
                    'produk_id' => OrderItem::find($item['order_item_id'])->produk_id,
                    'quantity' => $item['quantity'],
                    'reason' => $item['reason'] ?? null,
                ]);
            }

            return $return;
        });
    }

    /**
     * Approve a return request.
     */
    public function approveReturn(OrderReturn $return): void
    {
        if ($return->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Hanya permintaan retur dengan status menunggu yang dapat disetujui.',
            ]);
        }

        $return->update(['status' => 'approved']);
    }

    /**
     * Reject a return request.
     */
    public function rejectReturn(OrderReturn $return, ?string $reason = null): void
    {
        if ($return->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Hanya permintaan retur dengan status menunggu yang dapat ditolak.',
            ]);
        }

        $return->update([
            'status' => 'rejected',
            'notes' => $reason,
        ]);
    }

    /**
     * Complete a return — restore stock, create refund payment, update status.
     */
    public function completeReturn(OrderReturn $return): void
    {
        if ($return->status !== 'approved') {
            throw ValidationException::withMessages([
                'status' => 'Hanya permintaan retur yang sudah disetujui yang dapat diselesaikan.',
            ]);
        }

        DB::transaction(function () use ($return) {
            $return->load('items');

            foreach ($return->items as $item) {
                Produk::where('id', $item->produk_id)
                    ->increment('stok', $item->quantity);

                $produk = Produk::find($item->produk_id);

                Transaksi::create([
                    'tgl_transaksi' => now(),
                    'id_user' => $return->order->user_id,
                    'id_outlet' => $return->order->outlet_id,
                    'id_kategori' => $produk->id_kategori ?? 1,
                    'id_produk' => $item->produk_id,
                    'jenis_transaksi' => 'IN',
                    'jumlah_produk' => $item->quantity,
                    'keterangan' => "Retur #{$return->return_number}",
                    'harga_beli' => $produk->harga_beli,
                    'harga_jual' => $item->orderItem->price,
                ]);
            }

            if ($return->refund_amount > 0) {
                Payment::create([
                    'order_id' => $return->order_id,
                    'payment_number' => Payment::generatePaymentNumber(),
                    'payment_method' => $return->order->payment_method,
                    'amount' => $return->refund_amount,
                    'status' => 'refunded',
                ]);
            }

            $return->update([
                'status' => 'completed',
                'notes' => ($return->notes ? $return->notes."\n" : '').'Retur diselesaikan. Stok dikembalikan. Refund diproses.',
            ]);
        });
    }
}
