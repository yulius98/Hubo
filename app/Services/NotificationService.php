<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Produk;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Contracts\Notifications\Dispatcher as NotificationDispatcher;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class NotificationService
{
    public function __construct(protected NotificationDispatcher $dispatcher) {}

    /**
     * Notify every staff member of the company who holds the owner outlet or
     * admin outlet role.
     *
     * Staff are resolved from both the company's direct users and the users
     * attached to the company's outlets through the outlet_user pivot.
     */
    public function notifyCompanyStaff(Company $company, Notification $notification): void
    {
        $outletIds = $company->outlets()->pluck('outlets.id');
        $companyUserIds = $company->users()->pluck('users.id');

        $users = User::query()
            ->with('role')
            ->where(function ($query) use ($outletIds, $companyUserIds) {
                $query->whereIn('users.id', $companyUserIds)
                    ->orWhereHas('outlets', fn ($outlets) => $outlets->whereIn('outlets.id', $outletIds));
            })
            ->whereHas('role', fn ($role) => $role->whereIn('role', ['owner outlet', 'admin outlet']))
            ->get();

        foreach ($users as $user) {
            $this->dispatcher->sendNow($user, $notification);
        }
    }

    /**
     * Products of the company that are currently below or at their minimum
     * stock threshold (only products that have a threshold configured).
     */
    public function lowStockProducts(Company $company): Collection
    {
        $outletIds = $company->outlets()->pluck('outlets.id');

        $produks = Produk::query()
            ->whereIn('id_outlet', $outletIds)
            ->where('min_stok', '>', 0)
            ->with('variants')
            ->get();

        return $produks->filter(fn (Produk $produk) => $produk->effectiveStock() <= $produk->min_stok)
            ->values();
    }

    /**
     * Send a low stock notification to the owners/admins of the product's company.
     */
    public function notifyLowStock(Produk $produk): void
    {
        if ($produk->min_stok <= 0 || $produk->effectiveStock() > $produk->min_stok) {
            return;
        }

        $company = $produk->outlet?->company;

        if ($company === null) {
            return;
        }

        $this->notifyCompanyStaff($company, new LowStockNotification($produk));
    }
}
