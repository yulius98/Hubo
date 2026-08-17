<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaketController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\Admin\TenantController;
use Illuminate\Support\Facades\Route;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
    'role:super admin',
])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('tenants', [TenantController::class, 'index'])->name('tenants');
    Route::get('tenants/{company}', [TenantController::class, 'show'])->name('tenants.show');
    Route::post('tenants/{company}/suspend', [TenantController::class, 'suspend'])->name('tenants.suspend');
    Route::post('tenants/{company}/activate', [TenantController::class, 'activate'])->name('tenants.activate');
    Route::put('tenants/{company}/plan', [TenantController::class, 'changePlan'])->name('tenants.change-plan');

    Route::get('paket', [PaketController::class, 'index'])->name('paket');
    Route::post('paket', [PaketController::class, 'store'])->name('paket.store');
    Route::put('paket/{plan}', [PaketController::class, 'update'])->name('paket.update');
    Route::delete('paket/{plan}', [PaketController::class, 'destroy'])->name('paket.destroy');
    Route::post('paket/{plan}/toggle', [PaketController::class, 'toggleActive'])->name('paket.toggle');

    Route::get('payment-gateway', [PaymentGatewayController::class, 'index'])->name('payment-gateway');
    Route::put('payment-gateway', [PaymentGatewayController::class, 'update'])->name('payment-gateway.update');
});
