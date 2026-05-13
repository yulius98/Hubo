<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $outlet = Outlet::whereHas('users', function ($q) {
            $q->where('users.id', Auth::id())   // ambil id user yang sedang login
                ->where('outlet_user.role_id', 5); // pastikan role kasir
        })
            ->select(['id', 'nama_outlet'])
            ->first();

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

        return Inertia::render('akun_users/Cashier_page', ['outlet' => $outlet ?? [], 'produks' => $produks]);

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
