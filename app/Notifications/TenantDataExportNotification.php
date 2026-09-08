<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TenantDataExportNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $filename, public string $downloadUrl) {}

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
            'type' => 'tenant_data_export',
            'filename' => $this->filename,
            'download_url' => $this->downloadUrl,
            'message' => 'Salinan data toko siap diunduh.',
        ];
    }
}
