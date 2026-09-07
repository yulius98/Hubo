<?php

namespace App\Console\Commands;

use App\Services\SubscriptionBillingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('subscriptions:send-reminders')]
#[Description('Kirim pengingat tagihan langganan & tandai invoice yang lewat jatuh tempo sebagai overdue')]
class SendBillingReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(SubscriptionBillingService $billing): int
    {
        $counts = $billing->processReminders();

        $this->info('Pemrosesan pengingat tagihan selesai.');
        $this->table(
            ['Aksi', 'Jumlah'],
            [
                ['Reminder email terkirim', $counts['reminder_sent']],
                ['Invoice ditandai overdue', $counts['overdue']],
            ]
        );

        return self::SUCCESS;
    }
}
