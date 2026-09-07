<?php

namespace App\Http\Controllers\Admin;

use App\Exports\FinancialReportExport;
use App\Http\Controllers\Controller;
use App\Jobs\ExportFinancialReport;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Transaksi;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function monthFormat(string $column = 'tgl_transaksi'): string
    {
        return match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };
    }

    public function index(Request $request): Response
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        $baseQuery = Transaksi::query()
            ->where('jenis_transaksi', 'OUT')
            ->whereBetween('tgl_transaksi', [$startDate, $endDate]);

        if ($outletId) {
            $baseQuery->where('id_outlet', $outletId);
        }

        $revenue = (clone $baseQuery)->selectRaw('SUM(jumlah_produk * harga_jual) as total')->value('total') ?? 0;
        $cogs = (clone $baseQuery)->selectRaw('SUM(jumlah_produk * harga_beli) as total')->value('total') ?? 0;

        $expenseQuery = Expense::query()
            ->whereBetween('tanggal', [$startDate, $endDate]);

        if ($outletId) {
            $expenseQuery->where('outlet_id', $outletId);
        }

        $totalExpenses = (clone $expenseQuery)->sum('jumlah');
        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $totalExpenses;

        $monthlyBreakdown = Transaksi::query()
            ->where('jenis_transaksi', 'OUT')
            ->whereBetween('tgl_transaksi', [$startDate, $endDate])
            ->selectRaw($this->monthFormat().' as month')
            ->selectRaw('SUM(jumlah_produk * harga_jual) as revenue')
            ->selectRaw('SUM(jumlah_produk * harga_beli) as cogs')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $outlets = Outlet::all(['id', 'nama_outlet']);

        return Inertia::render('admin/reports', [
            'revenue' => $revenue,
            'cogs' => $cogs,
            'totalExpenses' => $totalExpenses,
            'grossProfit' => $grossProfit,
            'netProfit' => $netProfit,
            'monthlyBreakdown' => $monthlyBreakdown,
            'outlets' => $outlets,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'outlet_id' => $outletId,
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        return response()->streamDownload(function () use ($startDate, $endDate, $outletId) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Tanggal', 'Kategori', 'Debit', 'Kredit', 'Saldo']);

            $runningBalance = 0;

            $transaksiQuery = Transaksi::query()
                ->whereBetween('tgl_transaksi', [$startDate, $endDate])
                ->orderBy('tgl_transaksi')
                ->orderBy('id');

            if ($outletId) {
                $transaksiQuery->where('id_outlet', $outletId);
            }

            $transaksiQuery->chunk(200, function ($rows) use ($handle, &$runningBalance) {
                foreach ($rows as $t) {
                    $debit = $t->jenis_transaksi === 'IN'
                        ? $t->jumlah_produk * $t->harga_beli
                        : 0;
                    $kredit = $t->jenis_transaksi === 'OUT'
                        ? $t->jumlah_produk * $t->harga_jual
                        : 0;
                    $runningBalance += $debit - $kredit;

                    fputcsv($handle, [
                        $t->tgl_transaksi->format('Y-m-d'),
                        $t->jenis_transaksi === 'IN' ? 'Pemasukan' : 'Penjualan',
                        number_format($debit, 2, '.', ''),
                        number_format($kredit, 2, '.', ''),
                        number_format($runningBalance, 2, '.', ''),
                    ]);
                }
            });

            $expenseQuery = Expense::query()
                ->whereBetween('tanggal', [$startDate, $endDate])
                ->orderBy('tanggal')
                ->orderBy('id');

            if ($outletId) {
                $expenseQuery->where('outlet_id', $outletId);
            }

            $expenseQuery->chunk(200, function ($rows) use ($handle, &$runningBalance) {
                foreach ($rows as $e) {
                    $runningBalance -= $e->jumlah;

                    fputcsv($handle, [
                        $e->tanggal->format('Y-m-d'),
                        'Pengeluaran - '.$e->kategori,
                        0,
                        number_format($e->jumlah, 2, '.', ''),
                        number_format($runningBalance, 2, '.', ''),
                    ]);
                }
            });

            fclose($handle);
        }, "laporan-{$startDate}-{$endDate}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function exportExcel(Request $request): BinaryFileResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        $data = $this->gatherReportData($startDate, $endDate, $outletId);

        return Excel::download(
            new FinancialReportExport($data),
            "laporan-{$startDate}-{$endDate}.xlsx"
        );
    }

    public function exportPdf(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        $data = $this->gatherReportData($startDate, $endDate, $outletId);

        $pdf = Pdf::loadView('pdf.financial-report', $data)
            ->setPaper('a4', 'landscape');

        return $pdf->download("laporan-{$startDate}-{$endDate}.pdf");
    }

    /**
     * Queue the report generation into the background and notify the admin.
     */
    public function exportAsync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'format' => 'required|in:csv,xlsx,pdf',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'outlet_id' => 'nullable|exists:outlets,id',
        ]);

        ExportFinancialReport::dispatch(
            $request->user()->id,
            $validated['format'],
            $validated['start_date'],
            $validated['end_date'],
            $validated['outlet_id'] ?? null,
        );

        return back()->with('success', 'Laporan sedang disiapkan. Anda akan mendapat notifikasi saat siap diunduh.');
    }

    /**
     * Stream a finished (queued) report file to the admin. One-time friendly,
     * plain file names kept in the reports disk.
     */
    public function download(string $file): StreamedResponse
    {
        abort_unless(
            Storage::disk('reports')->exists($file)
                && str_contains($file, '/') === false
                && Str::endsWith($file, ['.csv', '.xlsx', '.pdf']),
            404
        );

        return Storage::disk('reports')->download($file);
    }

    /**
     * Monthly PPN (tax) recap from orders, excluding cancelled/expired/refunded.
     */
    public function taxReport(Request $request): Response
    {
        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        $summary = $this->taxSummary($startDate, $endDate, $outletId);

        return Inertia::render('admin/tax-reports', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'outlet_id' => $outletId,
            ],
            'outlets' => Outlet::all(['id', 'nama_outlet']),
            ...$summary,
        ]);
    }

    public function taxExportCsv(Request $request): StreamedResponse
    {
        $startDate = $request->query('start_date', now()->startOfYear()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $outletId = $request->query('outlet_id');

        return response()->streamDownload(function () use ($startDate, $endDate, $outletId) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Bulan', 'Outlet', 'Jumlah Faktur', 'Dasar Pengenaan Pajak', 'PPN', 'Total']);

            Order::query()
                ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
                ->when($outletId, fn ($query) => $query->where('outlet_id', $outletId))
                ->whereNotIn('status', ['cancelled', 'expired'])
                ->whereDoesntHave('returns', fn ($query) => $query->where('status', 'completed'))
                ->selectRaw(
                    $this->orderMonthFormat().' as month, outlet_id, '
                    .'COUNT(*) as order_count, '
                    .'SUM(total - tax) as taxable_total, '
                    .'SUM(tax) as tax_total, '
                    .'SUM(total) as order_total'
                )
                ->groupBy('month', 'outlet_id')
                ->orderBy('month')
                ->with('outlet:id,nama_outlet')
                ->get()
                ->each(function (Order $row) use ($handle) {
                    fputcsv($handle, [
                        $row->month,
                        $row->outlet?->nama_outlet ?? '—',
                        $row->order_count,
                        $row->taxable_total ?? 0,
                        $row->tax_total ?? 0,
                        $row->order_total ?? 0,
                    ]);
                });

            fclose($handle);
        }, "laporan-ppn-{$startDate}-{$endDate}.csv", [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function orderMonthFormat(): string
    {
        return match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%m', created_at)",
            'pgsql' => "to_char(created_at, 'YYYY-MM')",
            default => "DATE_FORMAT(created_at, '%Y-%m')",
        };
    }

    /**
     * @return array{total_ppn: float, total_orders: int, months: array<int, array<string, int|float|string>>}
     */
    private function taxSummary(string $startDate, string $endDate, ?string $outletId): array
    {
        $rows = Order::query()
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->when($outletId, fn ($query) => $query->where('outlet_id', $outletId))
            ->whereNotIn('status', ['cancelled', 'expired'])
            ->whereDoesntHave('returns', fn ($query) => $query->where('status', 'completed'))
            ->selectRaw(
                $this->orderMonthFormat().' as month, '
                .'COUNT(*) as order_count, '
                .'SUM(total - tax) as taxable_total, '
                .'SUM(tax) as tax_total, '
                .'SUM(total) as order_total'
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $months = $rows->map(fn (Order $row) => [
            'month' => $row->month,
            'order_count' => (int) $row->order_count,
            'taxable_total' => (float) round((float) $row->taxable_total, 2),
            'tax_total' => (float) round((float) $row->tax_total, 2),
            'order_total' => (float) round((float) $row->order_total, 2),
        ])->values()->all();

        return [
            'total_ppn' => (float) round((float) collect($rows)->sum('tax_total'), 2),
            'total_orders' => (int) collect($rows)->sum('order_count'),
            'months' => $months,
        ];
    }

    private function gatherReportData(string $startDate, string $endDate, ?string $outletId): array
    {
        $baseQuery = Transaksi::query()
            ->where('jenis_transaksi', 'OUT')
            ->whereBetween('tgl_transaksi', [$startDate, $endDate]);

        if ($outletId) {
            $baseQuery->where('id_outlet', $outletId);
        }

        $revenue = (clone $baseQuery)->selectRaw('SUM(jumlah_produk * harga_jual) as total')->value('total') ?? 0;
        $cogs = (clone $baseQuery)->selectRaw('SUM(jumlah_produk * harga_beli) as total')->value('total') ?? 0;

        $expenseQuery = Expense::query()
            ->whereBetween('tanggal', [$startDate, $endDate]);

        if ($outletId) {
            $expenseQuery->where('outlet_id', $outletId);
        }

        $totalExpenses = (clone $expenseQuery)->sum('jumlah');
        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $totalExpenses;

        $monthlyBreakdown = Transaksi::query()
            ->where('jenis_transaksi', 'OUT')
            ->whereBetween('tgl_transaksi', [$startDate, $endDate])
            ->selectRaw($this->monthFormat().' as month')
            ->selectRaw('SUM(jumlah_produk * harga_jual) as revenue')
            ->selectRaw('SUM(jumlah_produk * harga_beli) as cogs')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'revenue' => $revenue,
            'cogs' => $cogs,
            'totalExpenses' => $totalExpenses,
            'grossProfit' => $grossProfit,
            'netProfit' => $netProfit,
            'monthlyBreakdown' => $monthlyBreakdown,
        ];
    }
}
