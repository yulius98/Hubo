<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

#[Signature('app:backup-database')]
#[Description('Buat cadangan database (schema + data) ke storage/app/backups')]
class BackupDatabase extends Command
{
    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->newLine();
        $this->info('Membuat cadangan database…');

        try {
            $path = $this->runDump();
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Cadangan berhasil: '.$path);

        return self::SUCCESS;
    }

    /**
     * Determine the active database driver and delegate to the matching dump.
     */
    protected function runDump(): string
    {
        $connection = config('database.default');
        $config = config('database.connections.'.$connection);
        $driver = $config['driver'] ?? 'sqlite';

        $backupName = now()->format('Ymd_His').'.sql';

        $backupDir = storage_path('app/backups');
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $backupPath = $backupDir.'/'.$backupName;

        $command = match ($driver) {
            'pgsql' => $this->pgDumpCommand($config, $backupPath),
            'mysql', 'mariadb' => $this->mysqlDumpCommand($config, $backupPath),
            'sqlite' => $this->sqliteCopyCommand($config, $backupPath),
            default => throw new RuntimeException("Driver database '{$driver}' tidak didukung untuk backup."),
        };

        $process = Process::fromShellCommandline($command, null, null, null, 120);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Backup gagal: '.$process->getErrorOutput());
        }

        if (! file_exists($backupPath) || filesize($backupPath) === 0) {
            throw new RuntimeException('File cadangan tidak dihasilkan.');
        }

        $this->pruneOldBackups($this->backupDisk());

        return $backupPath;
    }

    /**
     * Build the pg_dump command for PostgreSQL.
     *
     * @param  array<string, mixed>  $config
     */
    protected function pgDumpCommand(array $config, string $backupPath): string
    {
        return sprintf(
            'PGPASSWORD=%s pg_dump --host=%s --port=%s --username=%s --dbname=%s --no-owner --file=%s',
            escapeshellarg($config['password'] ?? ''),
            escapeshellarg($config['host'] ?? '127.0.0.1'),
            escapeshellarg((string) ($config['port'] ?? 5432)),
            escapeshellarg($config['username'] ?? ''),
            escapeshellarg($config['database'] ?? ''),
            escapeshellarg($backupPath)
        );
    }

    /**
     * Build the mysqldump command for MySQL/MariaDB.
     *
     * @param  array<string, mixed>  $config
     */
    protected function mysqlDumpCommand(array $config, string $backupPath): string
    {
        return sprintf(
            'MYSQL_PWD=%s mysqldump --host=%s --port=%s --user=%s %s --result-file=%s',
            escapeshellarg($config['password'] ?? ''),
            escapeshellarg($config['host'] ?? '127.0.0.1'),
            escapeshellarg((string) ($config['port'] ?? 3306)),
            escapeshellarg($config['username'] ?? ''),
            escapeshellarg($config['database'] ?? ''),
            escapeshellarg($backupPath)
        );
    }

    /**
     * Build a copy command which duplicates the SQLite file.
     *
     * @param  array<string, mixed>  $config
     */
    protected function sqliteCopyCommand(array $config, string $backupPath): string
    {
        $database = $config['database'] ?? database_path('database.sqlite');

        return sprintf(
            '%s %s %s',
            escapeshellarg($this->sqliteBinary()),
            escapeshellarg($database),
            escapeshellarg($backupPath)
        );
    }

    protected function sqliteBinary(): string
    {
        $configured = (string) config('backup.sqlite_bin', 'sqlite3');

        foreach (array_unique(['sqlite3', $configured]) as $candidate) {
            $probe = Process::fromShellCommandline(sprintf('%s --version', escapeshellarg($candidate)));
            $probe->run();
            if ($probe->isSuccessful()) {
                return $candidate;
            }
        }

        throw new RuntimeException('sqlite3 CLI tidak ditemukan. Instal sqlite3 atau atur SQLITE_BACKUP_BIN.');
    }

    /**
     * Remove backups older than the configured retention (days).
     */
    protected function pruneOldBackups(Filesystem $disk): void
    {
        $retention = (int) config('backup.retention_days', 7);

        collect($disk->files('backups'))
            ->filter(fn (string $file) => str_ends_with($file, '.sql'))
            ->sort()
            ->reverse()
            ->slice($retention)
            ->each(fn (string $file) => $disk->delete($file));
    }

    protected function backupDisk(): Filesystem
    {
        return Storage::disk('local');
    }
}
