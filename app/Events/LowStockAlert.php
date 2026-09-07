<?php

namespace App\Events;

use App\Models\Produk;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Produk $produk) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('tenant.'.$this->produk->outlet?->company_id)];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'produk_id' => $this->produk->id,
            'product_name' => $this->produk->nama_produk,
            'stok' => $this->produk->effectiveStock(),
            'min_stok' => $this->produk->min_stok,
            'message' => "Stok \"{$this->produk->nama_produk}\" menipis (sisa {$this->produk->effectiveStock()} dari ambang {$this->produk->min_stok}).",
        ];
    }
}
