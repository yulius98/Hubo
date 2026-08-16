<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Subscription;
use App\Models\Transaksi;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Platform-wide metrics for the super admin.
     */
    public function index(): Response
    {
        $totalCompanies = (int) Company::withTrashed()->count();
        $activeCompanies = (int) Company::whereIn('status', ['active', 'trial'])->count();
        $suspendedCompanies = (int) Company::where('status', 'suspended')->count();

        $monthlyRecurringRevenue = (float) Subscription::query()
            ->where('status', 'active')
            ->join('plans', 'subscriptions.plan_id', '=', 'plans.id')
            ->sum('plans.price_monthly');

        $recentTenants = Company::with(['subscription.plan:id,name,slug,price_monthly'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Company $company) => $this->tenantSummary($company))
            ->values()
            ->all();

        $totalTransactions = (int) Transaksi::withTrashed()->count();

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'totalTenants' => $totalCompanies,
                'activeTenants' => $activeCompanies,
                'suspendedTenants' => $suspendedCompanies,
                'totalUsers' => (int) User::withTrashed()->count(),
                'totalOutlets' => (int) Outlet::withTrashed()->count(),
                'totalProducts' => (int) Produk::withTrashed()->count(),
                'totalTransactions' => $totalTransactions,
                'mrr' => round($monthlyRecurringRevenue, 2),
            ],
            'recentTenants' => $recentTenants,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function tenantSummary(Company $company): array
    {
        $plan = $company->subscription?->plan;

        return [
            'id' => $company->id,
            'name' => $company->name,
            'slug' => $company->slug,
            'status' => $company->status,
            'plan' => $plan?->name ?? '—',
            'plan_slug' => $plan?->slug ?? null,
            'outlet_count' => (int) $company->outlets()->count(),
            'user_count' => (int) $company->users()->count(),
            'created_at' => $company->created_at,
            'total_revenue' => (float) DB::table('transaksis')
                ->join('produks', 'transaksis.id_produk', '=', 'produks.id')
                ->join('outlets', 'transaksis.id_outlet', '=', 'outlets.id')
                ->where('outlets.company_id', $company->id)
                ->where('transaksis.jenis_transaksi', 'OUT')
                ->select(DB::raw('COALESCE(SUM(transaksis.jumlah_produk * produks.harga), 0)'))
                ->value('COALESCE(SUM(transaksis.jumlah_produk * produks.harga), 0)'),
        ];
    }
}
