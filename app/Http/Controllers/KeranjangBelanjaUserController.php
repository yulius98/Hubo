<?php

namespace App\Http\Controllers;

use App\Models\KeranjangBelanjaUser;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class KeranjangBelanjaUserController extends Controller
{
    /**
     * Display the pending cart items of the current user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $cartItems = KeranjangBelanjaUser::query()
            ->where('id_user', $user->id)
            ->where('status', 'pending')
            ->with('produk:id,nama_produk,gambar,harga,harga_diskon,stok')
            ->latest()
            ->get()
            ->map(function (KeranjangBelanjaUser $item) {
                $harga = $item->produk?->harga_diskon ?? $item->produk?->harga ?? 0;

                return [
                    'id' => $item->id,
                    'id_produk' => $item->id_produk,
                    'nama_produk' => $item->produk?->nama_produk ?? 'Produk dihapus',
                    'gambar' => $item->produk?->gambar,
                    'harga' => (int) ($item->produk?->harga ?? 0),
                    'harga_diskon' => $item->produk?->harga_diskon,
                    'stok' => (int) ($item->produk?->stok ?? 0),
                    'jumlah' => (int) $item->jumlah_produk,
                    'subtotal' => (int) ($harga * $item->jumlah_produk),
                ];
            })
            ->values()
            ->all();

        $total = (int) collect($cartItems)->sum('subtotal');

        return Inertia::render('pesanan_saya', [
            'cartItems' => $cartItems,
            'total' => $total,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Produk $produk)
    {
        $rules = ['jumlah_produk' => 'required|integer|min:1'];

        if ($produk->stok > 0) {
            $rules['jumlah_produk'] .= '|max:'.$produk->stok;
        }

        $validated = $request->validate($rules);

        $user = $request->user();

        if ($produk->stok <= 0) {
            throw ValidationException::withMessages([
                'produk' => 'Stok produk kosong.',
            ]);
        }

        $existing = KeranjangBelanjaUser::query()
            ->where('id_user', $user->id)
            ->where('id_produk', $produk->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            $existing->increment('jumlah_produk', (int) $validated['jumlah_produk']);
        } else {
            KeranjangBelanjaUser::create([
                'id_user' => $user->id,
                'id_kategori' => $produk->id_kategori,
                'id_produk' => $produk->id,
                'jumlah_produk' => (int) $validated['jumlah_produk'],
                'status' => 'pending',
            ]);
        }

        return redirect()->back()->with('success', 'Produk berhasil ditambahkan ke keranjang belanja');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, KeranjangBelanjaUser $keranjangBelanjaUser)
    {
        abort_if($keranjangBelanjaUser->id_user !== $request->user()->id, 403);

        $keranjangBelanjaUser->delete();

        return redirect()->back()->with('success', 'Item dihapus dari keranjang');
    }

    /**
     * Check out all pending cart items.
     */
    public function checkout(Request $request)
    {
        $user = $request->user();

        $pendingCount = KeranjangBelanjaUser::query()
            ->where('id_user', $user->id)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount === 0) {
            return redirect()->back()->with('error', 'Keranjang belanja kosong');
        }

        KeranjangBelanjaUser::query()
            ->where('id_user', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'done']);

        return redirect()->back()->with('success', 'Check out berhasil diproses');
    }
}
