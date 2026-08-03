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
     * Only the owner or admin of the category's outlet may update it.
     */
    public function update(User $user, Kategori $kategori): bool
    {
        $outlet = $kategori->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }

    /**
     * Only the owner or admin of the category's outlet may delete it.
     */
    public function delete(User $user, Kategori $kategori): bool
    {
        $outlet = $kategori->outlet;

        return $outlet !== null && $this->create($user, $outlet);
    }
}
