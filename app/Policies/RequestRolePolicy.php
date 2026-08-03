<?php

namespace App\Policies;

use App\Models\Outlet;
use App\Models\RequestRole;
use App\Models\User;

class RequestRolePolicy
{
    /**
     * Only the owner of an outlet may view its staff requests.
     */
    public function viewAny(User $user, Outlet $outlet): bool
    {
        return $user->hasOutletRole($outlet, 'owner outlet');
    }

    /**
     * Only the owner of the request's outlet may approve it.
     */
    public function approve(User $user, RequestRole $requestRole): bool
    {
        $outlet = $requestRole->outlet;

        return $outlet !== null && $user->hasOutletRole($outlet, 'owner outlet');
    }

    /**
     * Only the owner of the request's outlet may reject it.
     */
    public function reject(User $user, RequestRole $requestRole): bool
    {
        $outlet = $requestRole->outlet;

        return $outlet !== null && $user->hasOutletRole($outlet, 'owner outlet');
    }
}
