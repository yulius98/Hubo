<?php

use App\Http\Controllers\Settings\ProfileController;
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

    Route::middleware('role:owner outlet')->group(function () {
        Route::get('settings/tenant', [TenantSettingsController::class, 'index'])->name('tenant-settings.index');
        Route::put('settings/tenant', [TenantSettingsController::class, 'updateCompany'])->name('tenant-settings.update');
        Route::put('settings/tenant/outlets/{outlet}', [TenantSettingsController::class, 'updateOutlet'])->name('tenant-settings.outlet.update');
    });
});
