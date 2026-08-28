<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pesanan Baru #'.$this->order->order_number)
            ->line('Ada pesanan baru yang masuk di outlet Anda.')
            ->line('Nomor pesanan: '.$this->order->order_number)
            ->line('Total: Rp '.number_format((float) $this->order->total, 0, ',', '.'))
            ->action('Lihat Pesanan', url('/admin/orders'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_order',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'total' => (float) $this->order->total,
            'message' => "Pesanan baru {$this->order->order_number} masuk dengan total Rp ".number_format((float) $this->order->total, 0, ',', '.'),
        ];
    }
}
