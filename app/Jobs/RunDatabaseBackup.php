<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunDatabaseBackup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public int $timeout = 600;

    /**
     * Run the database dump via the existing command.
     */
    public function handle(ConsoleKernel $kernel): void
    {
        $exitCode = $kernel->call('app:backup-database');

        if ($exitCode !== 0) {
            throw new \RuntimeException("app:backup-database exited with code {$exitCode}.");
        }
    }
}
