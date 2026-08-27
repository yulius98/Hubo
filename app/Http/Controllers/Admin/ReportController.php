<?php

namespace App\Http\Controllers\Admin;

use App\Exports\FinancialReportExport;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Outlet;
use App\Models\Transaksi;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function monthFormat(string $column = 'tgl_transaksi'): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
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
