<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Role;
use App\Models\Transaksi;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const PERIODES = ['harian', 'bulanan', 'tahunan'];

    private const DASHBOARD_ROLES = ['owner outlet', 'admin outlet', 'kasir'];

    /**
     * Display the dashboard for the selected outlet, filtered by the user's
     * role within that outlet.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedOutletId = (int) $request->session()->get('selected_outlet_id', 0);

        [$outlet, $role] = $this->resolveOutletContext($user, $selectedOutletId);

        if ($outlet === null) {
            return $this->renderEmptyState();
        }

        if (! in_array($role, self::DASHBOARD_ROLES, true)) {
            return $this->renderEmptyState('Akses Dashboard Ditolak', 'Role Anda di outlet ini tidak memiliki akses ke halaman dashboard.');
        }

        [$periode, $tanggal] = $this->resolvePeriode($request);
        [$start, $end] = $this->periodWindow($periode, $tanggal);

        $transaksis = Transaksi::query()
            ->where('transaksis.id_outlet', $outlet->id)
            ->when($role === 'kasir', fn ($query) => $query->where('transaksis.id_user', $user->id))
            ->whereBetween('transaksis.tgl_transaksi', [$start, $end])
            ->join('produks', 'transaksis.id_produk', '=', 'produks.id')
            ->get([
                'transaksis.id',
                'transaksis.tgl_transaksi',
                'transaksis.id_user',
                'transaksis.id_produk',
                'transaksis.jenis_transaksi',
                'transaksis.jumlah_produk',
                'produks.harga',
                'produks.harga_diskon',
                'produks.diskon',
            ]);

        $payload = [
            'outlet' => $outlet->only('id', 'nama_outlet'),
            'role' => $role,
            'periode' => $periode,
            'tanggal' => $tanggal,
            'statistik' => $this->buildStatistik($periode, $tanggal, $transaksis),
            'karyawan' => [],
            'topProduk' => [],
            'kurangLaku' => [],
            'recentTransaksis' => [],
        ];

        if (in_array($role, ['owner outlet', 'admin outlet'], true)) {
            $payload['recentTransaksis'] = $this->recentTransaksis($outlet);
        }

        if ($role === 'owner outlet') {
            $payload['karyawan'] = $this->karyawan($outlet);
            $payload['topProduk'] = $this->productRanking($outlet, 'desc');
            $payload['kurangLaku'] = $this->productRanking($outlet, 'asc');
        }

        return Inertia::render('akun_users/dashboard', $payload);
    }

    /**
     * Resolve the outlet and the user's role within it.
     *
     * @return array{0: Outlet|null, 1: string|null}
     */
    private function resolveOutletContext(User $user, int $selectedOutletId): array
    {
        if (! $selectedOutletId) {
            return [null, null];
        }

        $outletUser = $user->outlets()
            ->wherePivot('outlet_id', $selectedOutletId)
            ->first();

        if ($outletUser === null) {
            return [null, null];
        }

        return [Outlet::find($selectedOutletId), Role::find($outletUser->pivot->role_id)?->role];
    }

    /**
     * Resolve the selected period and date value from the query string.
     *
     * @return array{0: string, 1: string}
     */
    private function resolvePeriode(Request $request): array
    {
        $periode = in_array($request->query('periode'), self::PERIODES, true)
            ? (string) $request->query('periode')
            : 'harian';

        $tanggal = (string) $request->query('tanggal', '');

        $tanggal = match ($periode) {
            'bulanan' => preg_match('/^\d{4}-\d{2}$/', $tanggal) ? $tanggal : now()->format('Y-m'),
            'tahunan' => preg_match('/^\d{4}$/', $tanggal) ? $tanggal : (string) now()->year,
            default => preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal) ? $tanggal : now()->format('Y-m-d'),
        };

        return [$periode, $tanggal];
    }

    /**
     * Resolve the datetime window for the given period.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function periodWindow(string $periode, string $tanggal): array
    {
        return match ($periode) {
            'bulanan' => [
                Carbon::parse($tanggal.'-01')->startOfMonth(),
                Carbon::parse($tanggal.'-01')->endOfMonth(),
            ],
            'tahunan' => [
                Carbon::parse($tanggal.'-01-01')->startOfYear(),
                Carbon::parse($tanggal.'-01-01')->endOfYear(),
            ],
            default => [
                Carbon::parse($tanggal)->startOfDay(),
                Carbon::parse($tanggal)->endOfDay(),
            ],
        };
    }

    /**
     * Build hourly/daily/monthly series for transactions, products sold and
     * revenue (omset) within the selected period.
     *
     * @return array<string, array{total: int|float, labels: list<string>, data: list<int|float>}>
     */
    private function buildStatistik(string $periode, string $tanggal, Collection $transaksis): array
    {
        [$labels, $keys] = $this->bucketDefinitions($periode, $tanggal);

        $totals = [
            'transaksi' => array_fill_keys($keys, 0),
            'produk_terjual' => array_fill_keys($keys, 0),
            'omset' => array_fill_keys($keys, 0),
        ];

        foreach ($transaksis as $transaksi) {
            $bucket = $this->bucketKey($periode, $transaksi);

            $totals['transaksi'][$bucket]++;

            if ($transaksi->jenis_transaksi !== 'OUT') {
                continue;
            }

            $totals['produk_terjual'][$bucket] += $transaksi->jumlah_produk;
            $hargaEfektif = ($transaksi->diskon === 'yes' && $transaksi->harga_diskon !== null)
                ? (float) $transaksi->harga_diskon
                : (float) $transaksi->harga;
            $totals['omset'][$bucket] += $transaksi->jumlah_produk * $hargaEfektif;
        }

        return [
            'transaksi' => [
                'total' => array_sum($totals['transaksi']),
                'labels' => $labels,
                'data' => array_values($totals['transaksi']),
            ],
            'produk_terjual' => [
                'total' => array_sum($totals['produk_terjual']),
                'labels' => $labels,
                'data' => array_values($totals['produk_terjual']),
            ],
            'omset' => [
                'total' => array_sum($totals['omset']),
                'labels' => $labels,
                'data' => array_values($totals['omset']),
            ],
        ];
    }

    /**
     * @return array{0: list<string>, 1: list<int>}
     */
    private function bucketDefinitions(string $periode, string $tanggal): array
    {
        return match ($periode) {
            'bulanan' => [
                array_map('strval', range(1, Carbon::parse($tanggal.'-01')->daysInMonth)),
                range(1, Carbon::parse($tanggal.'-01')->daysInMonth),
            ],
            'tahunan' => [
                ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                range(1, 12),
            ],
            default => [
                collect(range(0, 23))->map(fn (int $hour) => str_pad((string) $hour, 2, '0', STR_PAD_LEFT))->all(),
                range(0, 23),
            ],
        };
    }

    private function bucketKey(string $periode, Transaksi $transaksi): int
    {
        $waktu = Carbon::parse($transaksi->tgl_transaksi);

        return match ($periode) {
            'bulanan' => (int) $waktu->format('j'),
            'tahunan' => (int) $waktu->format('n'),
            default => (int) $waktu->format('G'),
        };
    }

    /**
     * The ten most recent transactions for the outlet.
     */
    private function recentTransaksis(Outlet $outlet): array
    {
        return Transaksi::query()
            ->with(['produk:id,nama_produk', 'kategori:id,kategori', 'user:id,name'])
            ->where('id_outlet', $outlet->id)
            ->latest('tgl_transaksi')
            ->limit(10)
            ->get()
            ->map(fn (Transaksi $transaksi) => [
                'id' => $transaksi->id,
                'tgl_transaksi' => $transaksi->tgl_transaksi,
                'produk' => $transaksi->produk->nama_produk ?? '—',
                'kategori' => $transaksi->kategori->kategori ?? '—',
                'jenis_transaksi' => $transaksi->jenis_transaksi,
                'jumlah_produk' => $transaksi->jumlah_produk,
                'user' => $transaksi->user->name ?? '—',
            ])
            ->values()
            ->all();
    }

    /**
     * The employees of the outlet together with their outlet role.
     */
    private function karyawan(Outlet $outlet): array
    {
        $roles = Role::pluck('role', 'id');

        return $outlet->users()
            ->get(['users.id', 'users.name', 'users.email', 'users.avatar'])
            ->map(fn (User $staff) => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'avatar' => $staff->avatar,
                'role' => $roles[$staff->pivot->role_id] ?? null,
            ])
            ->values()
            ->all();
    }

    /**
     * Rank the outlet's products by total units sold (OUT transactions).
     */
    private function productRanking(Outlet $outlet, string $direction): array
    {
        return Transaksi::query()
            ->join('produks', 'transaksis.id_produk', '=', 'produks.id')
            ->where('transaksis.id_outlet', $outlet->id)
            ->where('transaksis.jenis_transaksi', 'OUT')
            ->groupBy('produks.id', 'produks.nama_produk')
            ->orderByRaw('SUM(transaksis.jumlah_produk) '.$direction)
            ->limit(5)
            ->get([
                'produks.id',
                'produks.nama_produk',
                DB::raw('SUM(transaksis.jumlah_produk) as total_terjual'),
            ])
            ->map(fn (Transaksi $transaksi) => [
                'id' => (int) $transaksi->id,
                'nama_produk' => $transaksi->nama_produk,
                'total_terjual' => (int) $transaksi->total_terjual,
            ])
            ->values()
            ->all();
    }

    private function renderEmptyState(string $title = 'Pilih Outlet Terlebih Dahulu', string $message = 'Untuk melihat dashboard, silakan pilih outlet aktif terlebih dahulu pada menu Outlet Aktif di sidebar.'): Response
    {
        return Inertia::render('akun_users/dashboard', [
            'outlet' => null,
            'role' => null,
            'periode' => 'harian',
            'tanggal' => now()->format('Y-m-d'),
            'statistik' => null,
            'karyawan' => [],
            'topProduk' => [],
            'kurangLaku' => [],
            'recentTransaksis' => [],
            'emptyState' => [
                'title' => $title,
                'message' => $message,
            ],
        ]);
    }
}
