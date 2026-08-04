<?php

namespace App\Policies;

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\User;

class KategoriPolicy
{
    /**
     * Only the owner or admin of an outlet may list its categories.
     */
    public function viewAny(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet')
            || $user->hasOutletRole($outlet, 'admin outlet');
    }

    /**
     * Only the owner or admin of an outlet may create a category.
     */
    public function create(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet')
            || $user->hasOutletRole($outlet, 'admin outlet');
    }

    /**
     * Only the owner or admin of at least one of the category's outlets may update it.
     */
    public function update(User $user, Kategori $kategori): bool
    {
        return $kategori->outlets
            ->contains(fn (Outlet $outlet) => $this->create($user, $outlet));
    }

    /**
     * Only the owner or admin of at least one of the category's outlets may delete it.
     */
    public function delete(User $user, Kategori $kategori): bool
    {
        return $kategori->outlets
            ->contains(fn (Outlet $outlet) => $this->create($user, $outlet));
    }
}
