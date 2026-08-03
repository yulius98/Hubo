<?php

use App\Http\Controllers\CashierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomepageController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\KelolaProdukController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\RequestRoleController;
use App\Http\Controllers\RequestStaffController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');
Route::get('produk/{produk}/detail', [ProdukController::class, 'show'])->name('produk.detail');

Route::middleware(['auth', ValidateSessionWithWorkOS::class])->group(function () {

    Route::get('homapage', [HomepageController::class, 'index'])->name('homepage');

    Route::get('myprofile', function () {
        return Inertia::render('akun_users/profile_user_page');
    })->name('myprofile');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::middleware('role:owner outlet,admin outlet')->group(function () {
        Route::get('kelola_kategori', [KategoriController::class, 'index'])->name('kategori');
        Route::post('kelola_kategori', [KategoriController::class, 'store'])->name('kategori.add');
        Route::put('kelola_kategori/{kategori}', [KategoriController::class, 'update'])->name('kategori.update');
        Route::delete('kelola_kategori/{kategori}', [KategoriController::class, 'destroy'])->name('kategori.delete');
    });

    Route::get('kelola_produk', [KelolaProdukController::class, 'index'])->name('kelola_produk');

    Route::get('myoutlet', [OutletController::class, 'index'])->name('myoutlet');
    Route::post('myoutlet', [OutletController::class, 'store'])->name('myoutlet.add');
    Route::put('myoutlet/{outlet}', [OutletController::class, 'update'])->middleware('role:owner outlet')->name('myoutlet.update');
    Route::delete('myoutlet/{outlet}', [OutletController::class, 'destroy'])->middleware('role:owner outlet')->name('myoutlet.delete');

    Route::get('produk/{outlet_id}', [ProdukController::class, 'index'])->middleware('role:owner outlet,admin outlet,kasir')->name('produk');
    Route::post('produk', [ProdukController::class, 'store'])->middleware('role:owner outlet,admin outlet')->name('produk.add');
    Route::put('produk/{produk}', [ProdukController::class, 'update'])->middleware('role:owner outlet,admin outlet')->name('produk.update');
    Route::delete('produk/{produk}', [ProdukController::class, 'destroy'])->middleware('role:owner outlet,admin outlet')->name('produk.delete');

    Route::get('req_staff', [RequestStaffController::class, 'index'])->name('req_staff');
    Route::post('req_staff', [RequestStaffController::class, 'store'])->name('req_staff.add');

    Route::get('add_staff/{outlet_id}', [RequestRoleController::class, 'index'])->middleware('role:owner outlet')->name('add_staff');
    Route::post('add_staff/{id}/terima', [RequestRoleController::class, 'terima'])->middleware('role:owner outlet')->name('terima_staff');
    Route::put('add_staff/{id}/tolak', [RequestRoleController::class, 'tolak'])->middleware('role:owner outlet')->name('tolak_staff');
    Route::post('outlet/{outlet}/remove-staff', [RequestRoleController::class, 'removeStaff'])->middleware('role:owner outlet')->name('remove_staff');

    Route::get('cashier', [CashierController::class, 'index'])->middleware('role:kasir,owner outlet')->name('cashier');

    Route::post('select-outlet', function (Request $request) {
        $outletId = (int) $request->input('outlet_id');
        $user = $request->user();

        if ($outletId && $user && ! $user->outlets()->wherePivot('outlet_id', $outletId)->exists()) {
            abort(403, 'Unauthorized.');
        }

        if ($outletId) {
            $request->session()->put('selected_outlet_id', $outletId);
        } else {
            $request->session()->forget('selected_outlet_id');
        }

        return redirect()->back();
    })->name('select-outlet');

});

Route::post('set-locale', function (Request $request) {
    $locale = $request->input('locale', 'id');

    if (in_array($locale, ['id', 'en'])) {
        $request->session()->put('locale', $locale);
    }

    return redirect()->back();
})->name('set-locale');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
