<?php

namespace App\Http\Controllers;

use App\Models\KeranjangBelanjaKasir;
use App\Models\Produk;
use App\Models\Role;
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
        ]);

        $user = $request->user();
        $produk = Produk::query()->findOrFail($validated['id_produk']);

        if ($produk->id_kategori !== (int) $validated['id_kategori']) {
            throw ValidationException::withMessages([
                'id_kategori' => 'Kategori tidak cocok dengan produk.',
            ]);
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
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            $existing->increment('jumlah_produk', (int) $validated['jumlah_produk']);
        } else {
            KeranjangBelanjaKasir::create([
                'id_user' => $user->id,
                'id_kategori' => $produk->id_kategori,
                'id_produk' => $produk->id,
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
     * Mark all pending cart items as done after payment.
     */
    public function finalize(Request $request)
    {
        KeranjangBelanjaKasir::query()
            ->where('id_user', $request->user()->id)
            ->where('status', 'pending')
            ->update(['status' => 'done']);

        return redirect()->back()->with('success', 'Pembayaran berhasil diproses');
    }
}
