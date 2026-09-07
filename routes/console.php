<?php

use App\Jobs\RunDatabaseBackup;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('subscriptions:process-billing')->daily();
Schedule::command('subscriptions:send-reminders')->daily();
Schedule::job(new RunDatabaseBackup)->dailyAt('03:00');
