<?php

use Illuminate\Support\Facades\Artisan;

test('backup command signature is registered', function () {
    $commands = Artisan::all();

    expect(array_key_exists('app:backup-database', $commands))->toBeTrue();
});

test('backup command has a description', function () {
    $commands = Artisan::all();

    $command = $commands['app:backup-database'] ?? null;

    expect($command)->not->toBeNull()
        ->and($command->getDescription())->not->toBeEmpty();
});

test('backup command returns non-zero when dump tool is unavailable', function () {
    $this->artisan('app:backup-database')
        ->assertExitCode(1);
});
