<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the order resource for the public API (lightweight fields).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'shipping_cost' => (float) $this->shipping_cost,
            'discount' => (float) $this->discount,
            'tax' => (float) $this->tax,
            'total' => (float) $this->total,
            'payment_method' => $this->payment_method,
            'courier' => $this->courier,
            'tracking_number' => $this->tracking_number,
            'shipping_address' => $this->shipping_address,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'produk_id' => $item->produk_id,
                'variant_name' => $item->variant_name,
                'nama_produk' => $item->product_name,
                'jumlah_produk' => $item->quantity,
                'harga' => (float) $item->price,
                'subtotal' => (float) $item->subtotal,
            ])),
        ];
    }
}
