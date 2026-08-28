<?php

namespace App\Notifications;

use App\Models\Outlet;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class StaffRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  'accepted'|'rejected'  $result
     */
    public function __construct(public Outlet $outlet, public string $result) {}

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
        $resultLabel = $this->result === 'accepted' ? 'diterima' : 'ditolak';

        return [
            'type' => 'staff_request',
            'outlet_id' => $this->outlet->id,
            'outlet_name' => $this->outlet->nama_outlet,
            'result' => $this->result,
            'message' => "Permintaan Anda untuk bergabung di \"{$this->outlet->nama_outlet}\" telah {$resultLabel}.",
        ];
    }
}
