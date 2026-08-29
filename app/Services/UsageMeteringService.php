<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Order;
use App\Models\Transaksi;
use App\Models\UsageMetric;
use Carbon\CarbonInterface;

class UsageMeteringService
{
    /**
     * Increment a usage metric for the current period.
     */
    public function increment(Company|int|null $company, string $metric, int $by = 1, int|string|null $outletId = null, ?CarbonInterface $when = null): void
    {
        $companyId = $company instanceof Company ? $company->id : $company;

        if ($companyId === null) {
            return;
        }

        $period = ($when ?? now())->format('Y-m');

        $existing = UsageMetric::firstOrCreate([
            'company_id' => $companyId,
            'outlet_id' => $outletId,
            'period' => $period,
            'metric' => $metric,
        ]);

        $existing->increment('value', max(0, (int) $by));
    }

    /**
     * The usage value for a company, metric and period.
     */
    public function get(Company|int|null $company, string $metric, ?string $period = null, int|string|null $outletId = null): int
    {
        $companyId = $company instanceof Company ? $company->id : $company;

        if ($companyId === null) {
            return 0;
        }

        return (int) UsageMetric::query()
            ->where('company_id', $companyId)
            ->when($period !== null, fn ($query) => $query->where('period', $period))
            ->when($outletId !== null, fn ($query) => $query->where('outlet_id', $outletId))
            ->where('metric', $metric)
            ->sum('value');
    }

    /**
     * Increment metrics derived from a newly placed order.
     */
    public function recordOrder(Order $order): void
    {
        $company = $order->outlet?->company;

        if ($company === null) {
            return;
        }

        $this->increment($company, UsageMetric::METRIC_ORDERS, outletId: $order->outlet_id);
        $this->increment($company, UsageMetric::METRIC_GROSS_REVENUE, by: (int) round((float) $order->total), outletId: $order->outlet_id);
    }

    /**
     * Increment the transaction counter for a POS/cashier transaction.
     */
    public function recordTransaction(Transaksi $transaksi): void
    {
        $company = $transaksi->outlet?->company;

        if ($company === null) {
            return;
        }

        $this->increment($company, UsageMetric::METRIC_TRANSACTIONS, outletId: $transaksi->id_outlet);
    }
}
