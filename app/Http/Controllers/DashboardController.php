<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard filtered by role and accessed outlet.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $user->load('role');

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $adminRoleId = Role::where('role', 'admin outlet')->value('id');
        $roleNames = $user->role->pluck('role')->toArray();

        if (in_array('owner outlet', $roleNames)) {
            $outletIds = $user->outlets()->wherePivot('role_id', $ownerRoleId)->pluck('outlets.id');
        } elseif (in_array('admin outlet', $roleNames)) {
            $outletIds = $user->outlets()->wherePivot('role_id', $adminRoleId)->pluck('outlets.id');
        } else {
            $outletIds = $user->outlets()->pluck('outlets.id');
        }

        $selectedOutletId = (int) session('selected_outlet_id', 0);

        if ($selectedOutletId && $outletIds->contains($selectedOutletId)) {
            $filteredIds = collect([$selectedOutletId]);
        } else {
            $filteredIds = $outletIds;
        }

        $transactions = Transaksi::query()
            ->whereIn('id_outlet', $filteredIds)
            ->with(['outlet:id,nama_outlet', 'produk:id,nama_produk', 'kategori:id,kategori', 'user:id,name']);

        $stats = (clone $transactions)->get();

        $perOutlet = $filteredIds->count() > 1
            ? $stats->groupBy('id_outlet')->map(fn ($items, $outletId) => [
                'outlet_id' => (int) $outletId,
                'nama_outlet' => $items->first()->outlet->nama_outlet ?? '—',
                'total' => $items->count(),
            ])->values()
            : [];

        $outletLabel = $filteredIds->count() === 1
            ? ($stats->first()?->outlet->nama_outlet ?? 'Outlet')
            : 'Semua Outlet';

        return Inertia::render('akun_users/dashboard', [
            'stats' => [
                'totalTransaksi' => $stats->count(),
                'totalIn' => $stats->where('jenis_transaksi', 'IN')->count(),
                'totalOut' => $stats->where('jenis_transaksi', 'OUT')->count(),
                'jumlahIn' => $stats->where('jenis_transaksi', 'IN')->sum('jumlah_produk'),
                'jumlahOut' => $stats->where('jenis_transaksi', 'OUT')->sum('jumlah_produk'),
            ],
            'recentTransaksis' => $transactions->latest('tgl_transaksi')->limit(10)->get()->map(fn (Transaksi $transaksi) => [
                'id' => $transaksi->id,
                'tgl_transaksi' => $transaksi->tgl_transaksi,
                'outlet' => $transaksi->outlet->nama_outlet ?? '—',
                'produk' => $transaksi->produk->nama_produk ?? '—',
                'kategori' => $transaksi->kategori->kategori ?? '—',
                'jenis_transaksi' => $transaksi->jenis_transaksi,
                'jumlah_produk' => $transaksi->jumlah_produk,
                'user' => $transaksi->user->name ?? '—',
            ]),
            'perOutlet' => $perOutlet,
            'outletLabel' => $outletLabel,
            'selectedOutletId' => $filteredIds->count() === 1 ? $filteredIds->first() : null,
        ]);
    }
}
