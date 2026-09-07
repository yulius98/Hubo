<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Langganan / Billing
    |--------------------------------------------------------------------------
    |
    | Parameter yang bisa berubah dikelola lewat .env agar tidak ada nilai
    | hardcode di dalam kode.
    |
    */

    // Berapa hari sebelum jatuh tempo pengingat tagihan dikirim.
    'reminder_advance_days' => (int) env('BILLING_REMINDER_ADVANCE_DAYS', 3),

    // Masa tenggang (hari) invoice boleh lewat jatuh tempo sebelum tenant
    // benar-benar dibatasi. Nilai 0 berarti langsung dibatasi.
    'grace_days' => (int) env('BILLING_GRACE_DAYS', 0),
];
