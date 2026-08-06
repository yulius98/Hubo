<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Role;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StokController extends Controller
{
    /**
     * Display the stock management page.
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        $roleNames = $user->role->pluck('role')->toArray();

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $adminRoleId = Role::where('role', 'admin outlet')->value('id');

        if (in_array('owner outlet', $roleNames)) {
            $accessibleOutlets = $user->outlets()->wherePivot('role_id', $ownerRoleId)->pluck('outlets.id');
        } elseif (in_array('admin outlet', $roleNames)) {
            $accessibleOutlets = $user->outlets()->wherePivot('role_id', $adminRoleId)->pluck('outlets.id');
        } else {
            $accessibleOutlets = collect([]);
        }

        $selectedOutletId = (int) $request->session()->get('selected_outlet_id', 0);

        $outlet = null;
        if ($selectedOutletId && $accessibleOutlets->contains($selectedOutletId)) {
            $outlet = Outlet::find($selectedOutletId);
            $this->authorize('viewAny', [Transaksi::class, $outlet]);
        }

        $produks = Produk::query()
            ->with('kategori:id,kategori')
            ->when($outlet, fn ($query) => $query->where('id_outlet', $outlet->id))
            ->when(! $outlet, fn ($query) => $query->whereIn('id_outlet', $accessibleOutlets))
            ->orderBy('nama_produk')
            ->get(['id', 'id_outlet', 'id_kategori', 'gambar', 'nama_produk', 'harga', 'stok']);

        $riwayats = Transaksi::query()
            ->with(['produk:id,nama_produk', 'user:id,name'])
            ->when($outlet, fn ($query) => $query->where('id_outlet', $outlet->id))
            ->when(! $outlet, fn ($query) => $query->whereIn('id_outlet', $accessibleOutlets))
            ->latest('tgl_transaksi')
            ->limit(20)
            ->get(['id', 'tgl_transaksi', 'id_outlet', 'id_produk', 'jenis_transaksi', 'jumlah_produk', 'keterangan']);

        return Inertia::render('akun_users/kelola_stok', [
            'outlet' => $outlet,
            'produks' => $produks,
            'riwayats' => $riwayats,
            'selectedOutletId' => $selectedOutletId,
        ]);
    }

    /**
     * Record a stock movement and keep the produk stock column in sync.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_produk' => 'required|integer|exists:produks,id',
            'jenis_transaksi' => 'required|string|in:IN,OUT',
            'jumlah_produk' => 'required|integer|min:1',
            'keterangan' => 'nullable|string|max:255',
        ]);

        $produk = Produk::query()->lockForUpdate()->findOrFail($validated['id_produk']);
        $outlet = $produk->outlet;

        abort_if($outlet === null, 403, 'Outlet tidak ditemukan.');
        $this->authorize('create', [Transaksi::class, $outlet]);

        $sign = $validated['jenis_transaksi'] === 'IN' ? 1 : -1;
        $newStok = $produk->stok + ($sign * (int) $validated['jumlah_produk']);

        if ($newStok < 0) {
            throw ValidationException::withMessages([
                'jumlah_produk' => "Stok tidak mencukupi. Stok saat ini: {$produk->stok}.",
            ]);
        }

        DB::transaction(function () use ($produk, $validated, $request, $newStok) {
            $produk->update(['stok' => $newStok]);

            Transaksi::create([
                'tgl_transaksi' => now(),
                'id_user' => $request->user()->id,
                'id_outlet' => $produk->id_outlet,
                'id_kategori' => $produk->id_kategori,
                'id_produk' => $produk->id,
                'jenis_transaksi' => $validated['jenis_transaksi'],
                'jumlah_produk' => (int) $validated['jumlah_produk'],
                'keterangan' => $validated['keterangan'] ?? null,
            ]);
        });

        return redirect()->back()->with('success', 'Stok berhasil diperbarui');
    }

    /**
     * Revert a stock movement and keep the produk stock column in sync.
     */
    public function destroy(Request $request, Transaksi $transaksi)
    {
        $this->authorize('delete', $transaksi);

        $produk = Produk::query()->lockForUpdate()->findOrFail($transaksi->id_produk);

        $sign = $transaksi->jenis_transaksi === 'IN' ? 1 : -1;
        $newStok = $produk->stok - ($sign * $transaksi->jumlah_produk);

        if ($newStok < 0) {
            throw ValidationException::withMessages([
                'jumlah_produk' => 'Stok tidak boleh negatif saat membatalkan mutasi.',
            ]);
        }

        DB::transaction(function () use ($produk, $transaksi, $newStok) {
            $produk->update(['stok' => $newStok]);
            $transaksi->delete();
        });

        return redirect()->back()->with('success', 'Mutasi stok berhasil dibatalkan');
    }
}
