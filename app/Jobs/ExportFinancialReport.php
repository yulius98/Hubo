<?php

namespace App\Jobs;

use App\Exports\FinancialReportExport;
use App\Models\User;
use App\Notifications\ReportReadyNotification;
use App\Services\FinancialReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ExportFinancialReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 120, 600];

    public int $timeout = 900;

    /**
     * @param  'csv'|'xlsx'|'pdf'  $format
     */
    public function __construct(
        public int $userId,
        public string $format,
        public string $startDate,
        public string $endDate,
        public ?int $outletId = null,
    ) {}

    /**
     * Generate the report offline and notify the requesting admin.
     */
    public function handle(FinancialReportService $reports): void
    {
        $admin = User::find($this->userId);

        if ($admin === null) {
            return;
        }

        $data = $reports->gather($this->startDate, $this->endDate, $this->outletId);

        $filename = sprintf(
            'laporan-%s-%s-%s.%s',
            $this->startDate,
            $this->endDate,
            Str::random(8),
            $this->format
        );

        match ($this->format) {
            'csv', 'xlsx' => Excel::store(
                new FinancialReportExport($data),
                $filename,
                'reports',
                $this->format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX,
            ),
            'pdf' => Pdf::loadView('pdf.financial-report', $data)
                ->setPaper('a4', 'landscape')
                ->save(storage_path('app/reports/'.$filename)),
        };

        $admin->notify(new ReportReadyNotification(
            $filename,
            route('admin.reports.download', rawurlencode($filename)),
        ));
    }
}
