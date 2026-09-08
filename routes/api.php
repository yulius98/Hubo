<?php

use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProdukController;
use App\Http\Controllers\Api\V1\StokController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Hubo Public REST API v1
|--------------------------------------------------------------------------
|
| Authenticated with Laravel Sanctum personal access tokens. Every token is
| bound to a single outlet and carries scopes in the form `store:{outletId}:
| {ability}`. The `api.ability` middleware resolves the outlet from the token
| and enforces the requested scope.
|
| Abilities:
|   produk:read  — list/detail products of the bound outlet
|   stok:read    — stock levels of the bound outlet
|   order:read   — orders of the bound outlet
|   order:update — lightly update order status / tracking number
|
| Rate limiting: `throttle:api` (config `api.rate_limit_per_minute`).
|
| @example
|   curl -H "Authorization: Bearer TOKEN" \
|     https://hubo.test/api/v1/produk?page=1
|
*/

Route::middleware(['throttle:api', 'auth:sanctum'])->group(function () {
    Route::get('produk', [ProdukController::class, 'index'])->middleware('api.ability:produk:read');
    Route::get('produk/{produk}', [ProdukController::class, 'show'])->middleware('api.ability:produk:read');

    Route::get('stok', [StokController::class, 'index'])->middleware('api.ability:stok:read');

    Route::get('orders', [OrderController::class, 'index'])->middleware('api.ability:order:read');
    Route::get('orders/{order}', [OrderController::class, 'show'])->middleware('api.ability:order:read');
    Route::patch('orders/{order}', [OrderController::class, 'update'])->middleware('api.ability:order:update');
});
