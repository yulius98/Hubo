<?php

namespace App\Console\Commands;

use App\Services\SubscriptionBillingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('subscriptions:process-billing')]
#[Description('Proses tagihan langganan yang jatuh tempo (trial berakhir, perpanjangan, penghentian)')]
class ProcessSubscriptionBilling extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(SubscriptionBillingService $billing): int
    {
        $counts = $billing->processDueBilling();

        $this->info('Pemrosesan tagihan selesai.');
        $this->table(
            ['Kondisi', 'Jumlah'],
            [
                ['Invoiced (tagihan dibuat)', $counts['invoiced']],
                ['Free renewal (gratis diperpanjang)', $counts['free']],
                ['Expired (berakhir)', $counts['expired']],
            ]
        );

        return self::SUCCESS;
    }
}
