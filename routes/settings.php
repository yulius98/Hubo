<?php

use App\Http\Controllers\Settings\ApiTokenController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\TenantDataController;
use App\Http\Controllers\Settings\TenantSettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/security', [SecurityController::class, 'index'])->name('settings.security');
    Route::post('settings/security/two-fa/enable', [SecurityController::class, 'enable'])->name('settings.security.enable');
    Route::post('settings/security/two-fa/confirm', [SecurityController::class, 'confirm'])->name('settings.security.confirm');
    Route::post('settings/security/two-fa/disable', [SecurityController::class, 'disable'])->name('settings.security.disable');
    Route::put('settings/security/policy', [SecurityController::class, 'updatePolicy'])->name('settings.security.policy');

    Route::middleware('role:owner outlet')->group(function () {
        Route::get('settings/tenant', [TenantSettingsController::class, 'index'])->name('tenant-settings.index');
        Route::put('settings/tenant', [TenantSettingsController::class, 'updateCompany'])->name('tenant-settings.update');
        Route::put('settings/tenant/outlets/{outlet}', [TenantSettingsController::class, 'updateOutlet'])->name('tenant-settings.outlet.update');

        Route::prefix('settings/api-integrations')->group(function () {
            Route::get('/', [ApiTokenController::class, 'index'])->name('api-tokens.index');
            Route::post('/', [ApiTokenController::class, 'store'])->name('api-tokens.store');
            Route::delete('/', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
        });

        Route::get('settings/data', [TenantDataController::class, 'index'])->name('data.index');
        Route::post('settings/data/export', [TenantDataController::class, 'export'])->name('data.export');
        Route::get('settings/data/download', [TenantDataController::class, 'download'])
            ->middleware('signed')
            ->name('data.download');
        Route::delete('settings/data', [TenantDataController::class, 'destroy'])->name('data.destroy');
    });
});
