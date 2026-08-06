<?php

namespace App\Policies;

use App\Models\Outlet;
use App\Models\Transaksi;
use App\Models\User;

class TransaksiPolicy
{
    /**
     * Only the owner or admin of an outlet may view its stock movements.
     */
    public function viewAny(User $user, Outlet $outlet): bool
    {
        return $this->create($user, $outlet);
    }

    /**
     * Only the owner or admin of an outlet may record a stock movement.
     */
    public function create(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet')
            || $user->hasOutletRole($outlet, 'admin outlet');
    }

    /**
     * Only the owner or admin of the movement's outlet may edit it.
     */
    public function update(User $user, Transaksi $transaksi): bool
    {
        $outlet = $transaksi->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }

    /**
     * Only the owner or admin of the movement's outlet may revert it.
     */
    public function delete(User $user, Transaksi $transaksi): bool
    {
        $outlet = $transaksi->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }
}
