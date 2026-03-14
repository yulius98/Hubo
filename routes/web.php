<?php

use App\Http\Controllers\HomepageController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\KelolaProdukController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\RequestRoleController;
use App\Http\Controllers\RequestStaffController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/',[WelcomeController::class, 'index'])->name('welcome');


Route::middleware(['auth',ValidateSessionWithWorkOS::class,])->group(function () {

    Route::get('homapage', [HomepageController::class, 'index'])->name('homepage');

    Route::get('myprofile', function(){
        return Inertia::render('akun_users/profile_user_page');
    })->name('myprofile');

    Route::get('dashboard', function () {
        return Inertia::render('akun_users/dashboard');
    })->name('dashboard');


    Route::get('kelola_kategori', [KategoriController::class, 'index'])->name('kategori');
    Route::post('kelola_kategori', [KategoriController::class, 'store'])->name('kategori.add');
    Route::put('kelola_kategori/{kategori}', [KategoriController::class, 'update'])->name('kategori.update');
    Route::delete('kelola_kategori/{kategori}', [KategoriController::class, 'destroy'])->name('kategori.delete');

    Route::get('kelola_produk', [KelolaProdukController::class, 'index'])->name('kelola_produk');

    Route::get('myoutlet', [OutletController::class, 'index'])->name('myoutlet');
    Route::post('myoutlet', [OutletController::class, 'store'])->name('myoutlet.add');
    Route::put('myoutlet/{outlet}', [OutletController::class, 'update'])->name('myoutlet.update');
    Route::delete('myoutlet/{outlet}', [OutletController::class, 'destroy'])->name('myoutlet.delete');

    Route::get('produk/{outlet_id}', [ProdukController::class, 'index'])->name('produk');
    Route::post('produk',[ProdukController::class,'store'])->name('produk.add');
    Route::put('produk/{produk}', [ProdukController::class, 'update'])->name('produk.update');
    Route::delete('produk/{produk}', [ProdukController::class, 'destroy'])->name('produk.delete');

    Route::get('req_staff', [RequestStaffController::class, 'index'])->name('req_staff');
    Route::post('req_staff', [RequestStaffController::class,'store'])->name('req_staff.add');

    Route::get('add_staff/{outlet_id}', [RequestRoleController::class, 'index'])->name('add_staff');
    Route::post('add_staff/{id}/terima',[RequestRoleController::class, 'terima'])->name('terima_staff');
    Route::put('add_staff/{id}/tolak',[RequestRoleController::class, 'tolak'])->name('tolak_staff');




});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
