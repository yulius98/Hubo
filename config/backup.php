<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Database Backup
    |--------------------------------------------------------------------------
    |
    | Configure how database backups are performed. The SQLite binary override
    | is only used when the application runs on the sqlite driver.
    |
    */

    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 7),

    'sqlite_bin' => env('SQLITE_BACKUP_BIN', 'sqlite3'),

];
