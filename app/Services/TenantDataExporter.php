<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\PurchaseOrder;
use App\Models\SubscriptionInvoice;
use App\Models\Supplier;

class TenantDataExporter
{
    /**
     * Build a fully self-contained JSON snapshot of the tenant's data.
     *
     * @return array<string, mixed>
     */
    public function build(Company $company): array
    {
        $outlets = $company->outlets()->with(['kategori', 'produk', 'transaksi'])->get();
        $outletIds = $outlets->pluck('id')->all();

        $staff = $company->users()->with(['role', 'outlets'])->get();

        return [
            'exported_at' => now()->toIso8601String(),
            'company' => $company->attributesToArray(),
            'company_settings' => $company->settings()->get()->map(
                fn ($setting) => $setting->only(['key', 'value'])
            )->all(),
            'subscription' => $company->subscription?->load('plan')?->toArray() ?? null,
            'invoices' => SubscriptionInvoice::query()
                ->with(['subscription'])
                ->whereIn('subscription_id', $company->subscriptions()->pluck('id'))
                ->get()
                ->toArray(),
            'staff' => $staff->map(function ($user) {
                $profile = collect($user->attributesToArray())->only([
                    'id', 'name', 'email', 'phone', 'avatar', 'position',
                ])->all();

                return $profile + [
                    'roles' => $user->role->pluck('role')->all(),
                    'outlets' => $user->outlets->map(function ($outlet) use ($user) {
                        $roleName = $user->role->firstWhere('id', $outlet->pivot->role_id)?->role ?? null;

                        return [
                            'outlet_id' => $outlet->id,
                            'nama_outlet' => $outlet->nama_outlet,
                            'role' => $roleName,
                        ];
                    })->all(),
                ];
            })->all(),
            'outlets' => $outlets->map(fn ($outlet) => [
                'id' => $outlet->id,
                'nama_outlet' => $outlet->nama_outlet,
                'alamat_outlet' => $outlet->alamat_outlet,
                'kota' => $outlet->kota,
                'telp' => $outlet->telp,
                'kategoris' => $outlet->kategori->toArray(),
                'produks' => $outlet->produk->map(function ($produk) {
                    return collect($produk->attributesToArray())->only([
                        'id', 'id_kategori', 'nama_produk', 'gambar', 'keterangan',
                        'harga_beli', 'margin', 'harga', 'diskon', 'harga_diskon',
                        'stok', 'min_stok', 'rating', 'ppn', 'tax', 'sku',
                    ])->all();
                })->values()->all(),
                'transaksis' => $outlet->transaksi->map(function ($transaksi) {
                    return collect($transaksi->attributesToArray())->only([
                        'id', 'id_produk', 'id_user', 'tanggal', 'jenis',
                        'jumlah_produk', 'total_harga',
                    ])->all();
                })->values()->all(),
                'orders' => Order::query()
                    ->where('outlet_id', $outlet->id)
                    ->with(['items', 'payment', 'user'])
                    ->get()
                    ->map(function (Order $order) {
                        $data = collect($order->attributesToArray())->except(
                            ['outlet_id', 'user_id', 'created_at', 'updated_at']
                        )->all();

                        return $data + [
                            'outlet' => $order->outlet?->nama_outlet,
                            'placed_by' => $order->user?->email,
                            'items' => $order->items->toArray(),
                            'payments' => $order->payment ? [$order->payment->toArray()] : [],
                        ];
                    })->all(),
            ])->all(),
            'returns' => OrderReturn::query()
                ->where('company_id', $company->id)
                ->with(['items'])
                ->get()
                ->toArray(),
            'customers' => Customer::query()
                ->where('company_id', $company->id)
                ->get()
                ->toArray(),
            'coupons' => Coupon::query()
                ->where('company_id', $company->id)
                ->get()
                ->toArray(),
            'loyalty_transactions' => LoyaltyTransaction::query()
                ->where('company_id', $company->id)
                ->get()
                ->toArray(),
            'expenses' => Expense::query()
                ->where('company_id', $company->id)
                ->get()
                ->toArray(),
            'suppliers' => Supplier::query()
                ->where('company_id', $company->id)
                ->get()
                ->toArray(),
            'purchase_orders' => PurchaseOrder::query()
                ->where('company_id', $company->id)
                ->with(['items', 'supplier'])
                ->get()
                ->toArray(),
        ];
    }
}
