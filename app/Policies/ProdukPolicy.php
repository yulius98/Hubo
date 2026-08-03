<?php

namespace App\Policies;

use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;

class ProdukPolicy
{
    /**
     * Owner, admin and cashier of an outlet may list its products.
     */
    public function viewAny(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet')
            || $user->hasOutletRole($outlet, 'admin outlet')
            || $user->hasOutletRole($outlet, 'kasir');
    }

    /**
     * Owner and admin of the outlet may view a product.
     */
    public function view(User $user, Produk $produk): bool
    {
        $outlet = $produk->outlet;

        return $outlet !== null && $this->viewAny($user, $outlet);
    }

    /**
     * Only the owner or admin of the outlet may create a product.
     */
    public function create(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet')
            || $user->hasOutletRole($outlet, 'admin outlet');
    }

    /**
     * Only the owner or admin of the product's outlet may update it.
     */
    public function update(User $user, Produk $produk): bool
    {
        $outlet = $produk->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }

    /**
     * Only the owner or admin of the product's outlet may delete it.
     */
    public function delete(User $user, Produk $produk): bool
    {
        $outlet = $produk->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }
}
