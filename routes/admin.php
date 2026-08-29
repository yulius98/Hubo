<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\PaketController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ReturnController;
use App\Http\Controllers\Admin\ShippingSettingsController;
use App\Http\Controllers\Admin\SupplierController;
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

    Route::get('shipping-settings', [ShippingSettingsController::class, 'index'])->name('shipping-settings');
    Route::put('shipping-settings', [ShippingSettingsController::class, 'update'])->name('shipping-settings.update');

    Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers');
    Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders');
    Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
    Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('purchase-orders.update');
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('purchase-orders.receive');
    Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy');

    Route::get('expenses', [ExpenseController::class, 'index'])->name('expenses');
    Route::post('expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::put('expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

    Route::get('reports', [ReportController::class, 'index'])->name('reports');
    Route::get('reports/export', [ReportController::class, 'exportCsv'])->name('reports.export');
    Route::get('reports/export-excel', [ReportController::class, 'exportExcel'])->name('reports.export-excel');
    Route::get('reports/export-pdf', [ReportController::class, 'exportPdf'])->name('reports.export-pdf');

    Route::get('returns', [ReturnController::class, 'index'])->name('returns');

    Route::get('billing', [BillingController::class, 'index'])->name('billing');
    Route::post('billing/process', [BillingController::class, 'process'])->name('billing.process');

    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs');
});
