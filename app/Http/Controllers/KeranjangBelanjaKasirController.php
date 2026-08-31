<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\KeranjangBelanjaKasir;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\Role;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class KeranjangBelanjaKasirController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_produk' => 'required|integer|exists:produks,id',
            'id_kategori' => 'required|integer|exists:kategoris,id',
            'jumlah_produk' => 'required|integer|min:1',
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
        ]);

        $user = $request->user();
        $produk = Produk::query()->findOrFail($validated['id_produk']);

        if ($produk->id_kategori !== (int) $validated['id_kategori']) {
            throw ValidationException::withMessages([
                'id_kategori' => 'Kategori tidak cocok dengan produk.',
            ]);
        }

        if ($this->customerBelongsToDifferentCompany($validated['customer_id'] ?? null, $produk->outlet?->company_id)) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pelanggan tidak valid untuk outlet ini.',
            ]);
        }

        $variant = null;
        $variantId = isset($validated['variant_id']) ? (int) $validated['variant_id'] : null;

        if ($variantId !== null) {
            $variant = ProductVariant::query()
                ->where('id', $variantId)
                ->where('produk_id', $produk->id)
                ->where('is_active', true)
                ->first();

            if ($variant === null) {
                throw ValidationException::withMessages([
                    'variant_id' => 'Varian yang dipilih tidak valid.',
                ]);
            }
        }

        $kasirRoleId = Role::where('role', 'kasir')->value('id');
        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $accessibleOutletIds = $user->outlets()
            ->wherePivotIn('role_id', [$kasirRoleId, $ownerRoleId])
            ->pluck('outlets.id');

        abort_unless($accessibleOutletIds->contains($produk->id_outlet), 403, 'Produk tidak tersedia di outlet Anda.');

        $existing = KeranjangBelanjaKasir::query()
            ->where('id_user', $user->id)
            ->where('id_produk', $produk->id)
            ->where('variant_id', $variantId)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            $existing->increment('jumlah_produk', (int) $validated['jumlah_produk']);
        } else {
            KeranjangBelanjaKasir::create([
                'id_user' => $user->id,
                'id_kategori' => $produk->id_kategori,
                'id_produk' => $produk->id,
                'variant_id' => $variantId,
                'customer_id' => isset($validated['customer_id']) ? (int) $validated['customer_id'] : null,
                'jumlah_produk' => (int) $validated['jumlah_produk'],
                'status' => 'pending',
            ]);
        }

        return redirect()->back()->with('success', 'Produk ditambahkan ke keranjang');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, KeranjangBelanjaKasir $keranjangBelanjaKasir)
    {
        abort_if($keranjangBelanjaKasir->id_user !== $request->user()->id, 403);

        $keranjangBelanjaKasir->delete();

        return redirect()->back()->with('success', 'Item dihapus dari keranjang');
    }

    /**
     * Finalize the cashier cart by creating an order for the selected items.
     */
    public function finalize(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'points' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();
        $selectedOutletId = (int) $request->session()->get('selected_outlet_id');

        $selectedOutlet = Outlet::query()->with('company')->find($selectedOutletId);

        if ($selectedOutlet === null) {
            throw ValidationException::withMessages([
                'outlet' => 'Outlet yang dipilih tidak valid.',
            ]);
        }

        if ($this->customerBelongsToDifferentCompany($validated['customer_id'] ?? null, $selectedOutlet->company_id)) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pelanggan tidak valid untuk outlet ini.',
            ]);
        }

        try {
            $order = app(OrderService::class)->createFromKasirCart(
                userId: $user->id,
                outletId: $selectedOutletId,
                customerId: isset($validated['customer_id']) ? (int) $validated['customer_id'] : null,
                couponCode: $validated['coupon_code'] ?? null,
                points: (int) ($validated['points'] ?? 0),
                paymentMethod: $validated['payment_method'] ?? 'cash',
            );
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withInput()
                ->withErrors($e->errors());
        }

        return redirect()->route('orders.show', $order->id)
            ->with('success', 'Transaksi berhasil diproses');
    }

    /**
     * Check that a provided customer belongs to the requested company.
     */
    private function customerBelongsToDifferentCompany(?int $customerId, ?int $companyId): bool
    {
        if ($customerId === null || $companyId === null) {
            return false;
        }

        $customer = Customer::query()->find($customerId);

        return $customer === null || (int) $customer->company_id !== (int) $companyId;
    }
}
