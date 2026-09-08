<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\TenantDataExportNotification;
use App\Services\TenantDataExporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ExportTenantDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900;

    public function __construct(public int $userId) {}

    /**
     * Write a full JSON snapshot of the tenant to disk and let the user know.
     */
    public function handle(TenantDataExporter $exporter): void
    {
        $user = User::find($this->userId);

        if ($user?->company_id === null) {
            return;
        }

        $company = $user->company;

        $filename = sprintf(
            'tenant-export-%d-%s-%s.json',
            $company->id,
            now()->format('YmdHis'),
            Str::lower(Str::random(8)),
        );

        Storage::disk('tenant-data')->put(
            $filename,
            json_encode($exporter->build($company), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        );

        $user->notify(new TenantDataExportNotification(
            $filename,
            URL::temporarySignedRoute('data.download', now()->addHours(24), ['file' => $filename]),
        ));
    }
}
