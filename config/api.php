<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rate limiting for the public REST API
    |--------------------------------------------------------------------------
    |
    | Requests per minute per API token / user. Lower via env for tests.
    */
    'rate_limit_per_minute' => (int) env('API_RATE_LIMIT_PER_MINUTE', 60),
];
