<?php

namespace App\Policies;

use App\Models\Outlet;
use App\Models\User;

class OutletPolicy
{
    /**
     * Any authenticated user may list the outlets they belong to.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Any authenticated user may open a new outlet and become its owner.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only the owner of the outlet may view it.
     */
    public function view(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet');
    }

    /**
     * Only the owner of the outlet may update it.
     */
    public function update(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet');
    }

    /**
     * Only the owner of the outlet may delete it.
     */
    public function delete(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet');
    }
}
