<?php

namespace App\Http\Controllers;

use App\Models\KeranjangBelanjaKasir;
use App\Models\Produk;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $kasirRoleId = Role::where('role', 'kasir')->value('id');
        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');

        $selectedOutletId = (int) $request->session()->get('selected_outlet_id');

        $kasirOutlets = $user->outlets()
            ->wherePivot('role_id', $kasirRoleId)
            ->select(['outlets.id', 'outlets.nama_outlet'])
            ->get();

        $ownedOutlets = $user->outlets()
            ->wherePivot('role_id', $ownerRoleId)
            ->select(['outlets.id', 'outlets.nama_outlet'])
            ->get();

        $outlet = $kasirOutlets->firstWhere('id', $selectedOutletId)
            ?? $ownedOutlets->firstWhere('id', $selectedOutletId)
            ?? $kasirOutlets->first()
            ?? $ownedOutlets->first();

        abort_unless($outlet, 403, 'Unauthorized.');

        $produks = Produk::where('id_outlet', $outlet->id)
            ->orderBy('nama_produk')
            ->withSum(['transaksi as stok' => function ($query) {
                $query->select(DB::raw("SUM(
                            CASE
                                WHEN jenis_transaksi = 'IN' THEN jumlah_produk
                                WHEN jenis_transaksi = 'OUT' THEN -jumlah_produk
                                ELSE 0
                            END
                        )"));
            }], 'jumlah_produk')
            ->get();

        $keranjang = KeranjangBelanjaKasir::query()
            ->where('id_user', $user->id)
            ->where('status', 'pending')
            ->with('produk:id,nama_produk,harga')
            ->latest()
            ->get()
            ->map(fn (KeranjangBelanjaKasir $item) => [
                'id' => $item->id,
                'produk' => $item->produk?->nama_produk ?? 'Produk dihapus',
                'price' => (int) ($item->produk?->harga ?? 0),
                'quantity' => (int) $item->jumlah_produk,
            ])
            ->values()
            ->all();

        return Inertia::render('akun_users/Cashier_page', [
            'outlet' => $outlet,
            'produks' => $produks,
            'keranjang' => $keranjang,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
