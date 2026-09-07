<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Demo Data Seeding
    |--------------------------------------------------------------------------
    |
    | When enabled, the database seeder creates a representative demo tenant
    | with its catalog. Turn this off in production staging when a demo tenant
    | is not desired.
    |
    */

    'demo' => (bool) env('SEED_DEMO', true),

    /*
    |--------------------------------------------------------------------------
    | Super Admin Seeding
    |--------------------------------------------------------------------------
    |
    | The administrator account created by the seeder. Seeding is optional and
    | is skipped entirely when SEED_ADMIN_EMAIL is empty.
    |
    */

    'admin_email' => env('SEED_ADMIN_EMAIL'),

    'admin_name' => env('SEED_ADMIN_NAME', 'Admin Hubo'),

    'admin_password' => env('SEED_ADMIN_PASSWORD'),

    /*
    |--------------------------------------------------------------------------
    | Bulk Seeding Threshold
    |--------------------------------------------------------------------------
    |
    | Demo catalogs larger than this number of products are built through a
    | queued job instead of inline so the seeder stays fast.
    |
    */

    'bulk_threshold' => (int) env('SEED_BULK_THRESHOLD', 50),
];
