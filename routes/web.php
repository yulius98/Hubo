<?php

use App\Http\Controllers\CashierController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomepageController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\KaryawanController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\KelolaProdukController;
use App\Http\Controllers\KeranjangBelanjaKasirController;
use App\Http\Controllers\KeranjangBelanjaUserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\PaketController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\ProdukVariantController;
use App\Http\Controllers\RequestRoleController;
use App\Http\Controllers\RequestStaffController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\StokController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\WebhookController;
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

    Route::middleware('role:owner outlet')->group(function () {
        Route::get('paket', [PaketController::class, 'index'])->name('paket');
        Route::post('paket/ganti', [PaketController::class, 'changePlan'])->name('paket.ganti');
    });

    Route::middleware('role:owner outlet,admin outlet')->group(function () {
        Route::get('kelola_kategori', [KategoriController::class, 'index'])->name('kategori');
        Route::post('kelola_kategori', [KategoriController::class, 'store'])->name('kategori.add');
        Route::post('kelola_kategori/save', [KategoriController::class, 'save'])->name('kategori.save');
        Route::put('kelola_kategori/{kategori}', [KategoriController::class, 'update'])->name('kategori.update');
        Route::delete('kelola_kategori/{kategori}', [KategoriController::class, 'destroy'])->name('kategori.delete');

        Route::get('kelola_stok', [StokController::class, 'index'])->name('kelola_stok');
        Route::post('kelola_stok', [StokController::class, 'store'])->name('kelola_stok.add');
        Route::delete('kelola_stok/{transaksi}', [StokController::class, 'destroy'])->name('kelola_stok.delete');
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

    Route::get('produk/{produk}/variants', [ProdukVariantController::class, 'index'])->middleware('role:owner outlet,admin outlet')->name('produk.variants');
    Route::post('produk/{produk}/variants', [ProdukVariantController::class, 'store'])->middleware('role:owner outlet,admin outlet')->name('produk.variants.add');
    Route::put('produk/{produk}/variants/{variant}', [ProdukVariantController::class, 'update'])->middleware('role:owner outlet,admin outlet')->name('produk.variants.update');
    Route::delete('produk/{produk}/variants/{variant}', [ProdukVariantController::class, 'destroy'])->middleware('role:owner outlet,admin outlet')->name('produk.variants.delete');

    Route::middleware('role:owner outlet,admin outlet')->group(function () {
        Route::get('customers', [CustomerController::class, 'index'])->name('customers');
        Route::post('customers', [CustomerController::class, 'store'])->name('customers.add');
        Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.delete');

        Route::get('coupons', [CouponController::class, 'index'])->name('coupons');
        Route::post('coupons', [CouponController::class, 'store'])->name('coupons.add');
        Route::put('coupons/{coupon}', [CouponController::class, 'update'])->name('coupons.update');
        Route::post('coupons/{coupon}/toggle', [CouponController::class, 'toggle'])->name('coupons.toggle');
        Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->name('coupons.delete');
    });

    Route::get('notifikasi', [NotificationController::class, 'index'])->name('notifications');
    Route::post('notifikasi/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('notifikasi/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('notifikasi/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');

    Route::get('req_staff', [RequestStaffController::class, 'index'])->name('req_staff');
    Route::post('req_staff', [RequestStaffController::class, 'store'])->name('req_staff.add');

    Route::get('kelola_karyawan', [KaryawanController::class, 'index'])->middleware('role:owner outlet')->name('kelola_karyawan');
    Route::put('kelola_karyawan/{outlet}/role/{user}', [KaryawanController::class, 'updateRole'])->middleware('role:owner outlet')->name('kelola_karyawan.update_role');

    Route::get('add_staff/{outlet_id}', [RequestRoleController::class, 'index'])->middleware('role:owner outlet')->name('add_staff');
    Route::post('add_staff/{id}/terima', [RequestRoleController::class, 'terima'])->middleware('role:owner outlet')->name('terima_staff');
    Route::put('add_staff/{id}/tolak', [RequestRoleController::class, 'tolak'])->middleware('role:owner outlet')->name('tolak_staff');
    Route::post('outlet/{outlet}/remove-staff', [RequestRoleController::class, 'removeStaff'])->middleware('role:owner outlet')->name('remove_staff');

    Route::get('cashier', [CashierController::class, 'index'])->middleware('role:kasir,owner outlet')->name('cashier');

    Route::post('cashier/cart', [KeranjangBelanjaKasirController::class, 'store'])->middleware('role:kasir,owner outlet')->name('cashier.cart.add');
    Route::post('cashier/cart/finalize', [KeranjangBelanjaKasirController::class, 'finalize'])->middleware('role:kasir,owner outlet')->name('cashier.cart.finalize');
    Route::delete('cashier/cart/{keranjang_belanja_kasir}', [KeranjangBelanjaKasirController::class, 'destroy'])->middleware('role:kasir,owner outlet')->name('cashier.cart.delete');

    Route::post('produk/{produk}/keranjang-belanja', [KeranjangBelanjaUserController::class, 'store'])->name('cart.add');

    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::post('api/shipping/cost', [ShippingController::class, 'calculateCost'])->name('api.shipping.cost');

    Route::post('pesanan-saya/checkout', [KeranjangBelanjaUserController::class, 'checkout'])->name('pesanan_saya.checkout');

    Route::get('pesanan-saya', [KeranjangBelanjaUserController::class, 'index'])->name('pesanan_saya');

    Route::get('orders', [OrderController::class, 'index'])->name('orders');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('orders/{order}/invoice', [InvoiceController::class, 'show'])->name('orders.invoice');
    Route::get('orders/{order}/return-create', [OrderController::class, 'returnCreate'])->name('orders.return-create');

    Route::get('returns', [ReturnController::class, 'index'])->name('returns');
    Route::post('returns', [ReturnController::class, 'store'])->name('returns.store');
    Route::get('returns/{return}', [ReturnController::class, 'show'])->name('returns.show');
    Route::post('returns/{return}/approve', [ReturnController::class, 'approve'])->name('returns.approve');
    Route::post('returns/{return}/reject', [ReturnController::class, 'reject'])->name('returns.reject');
    Route::post('returns/{return}/complete', [ReturnController::class, 'complete'])->name('returns.complete');

    Route::delete('pesanan-saya/{keranjang_belanja_user}', [KeranjangBelanjaUserController::class, 'destroy'])->name('pesanan_saya.delete');

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
require __DIR__.'/admin.php';

Route::post('api/webhooks/xendit', [WebhookController::class, 'xendit'])->name('webhooks.xendit');
Route::post('api/webhooks/midtrans', [WebhookController::class, 'midtrans'])->name('webhooks.midtrans');

// Public storefront (catch-all): must stay last so specific routes win.
Route::get('{slug}', [StorefrontController::class, 'index'])->where('slug', '[a-z0-9_\-]+')->name('storefront');
