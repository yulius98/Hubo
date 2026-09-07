<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Transaksi;
use Illuminate\Support\Facades\DB;

class FinancialReportService
{
    /**
     * Build the shared report dataset (revenue, cogs, expenses, monthly
     * breakdown) used by the admin report page, the synchronous exports and
     * the queued export job.
     *
     * @return array<string, mixed>
     */
    public function gather(string $startDate, string $endDate, ?int $outletId = null): array
    {
        $baseQuery = Transaksi::query()->whereBetween('tgl_transaksi', [$startDate, $endDate]);

        if ($outletId !== null) {
            $baseQuery->where('id_outlet', $outletId);
        }

        $revenueQuery = (clone $baseQuery)->where('jenis_transaksi', 'OUT');
        $revenue = (clone $revenueQuery)->selectRaw('SUM(jumlah_produk * harga_jual) as total')->value('total') ?? 0;
        $cogs = (clone $revenueQuery)->selectRaw('SUM(jumlah_produk * harga_beli) as total')->value('total') ?? 0;

        $expenseQuery = Expense::query()->whereBetween('tanggal', [$startDate, $endDate]);

        if ($outletId !== null) {
            $expenseQuery->where('outlet_id', $outletId);
        }

        $totalExpenses = (clone $expenseQuery)->sum('jumlah');

        $monthlyBreakdown = (clone $baseQuery)
            ->where('jenis_transaksi', 'OUT')
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
            'grossProfit' => $revenue - $cogs,
            'netProfit' => ($revenue - $cogs) - $totalExpenses,
            'monthlyBreakdown' => $monthlyBreakdown,
        ];
    }

    /**
     * Month formatting that works across supported databases.
     */
    public function monthFormat(string $column = 'tgl_transaksi'): string
    {
        return match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };
    }
}
