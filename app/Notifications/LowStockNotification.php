<?php

namespace App\Notifications;

use App\Models\Produk;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Produk $produk) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'low_stock',
            'produk_id' => $this->produk->id,
            'product_name' => $this->produk->nama_produk,
            'stok' => $this->produk->effectiveStock(),
            'min_stok' => $this->produk->min_stok,
            'message' => "Stok \"{$this->produk->nama_produk}\" menipis (sisa {$this->produk->effectiveStock()} dari ambang ".$this->produk->min_stok.').',
        ];
    }
}
