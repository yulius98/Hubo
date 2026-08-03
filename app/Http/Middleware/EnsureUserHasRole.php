<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Check that the authenticated user holds at least one of the given roles.
     *
     * Roles are checked against the global pivot table (`role_user`). If an
     * `outlet:{id}` token is present among the arguments, the remaining roles
     * are additionally validated against the per-outlet pivot table
     * (`outlet_user`) for the given outlet.
     *
     * Example usage:
     * - `role:owner outlet,admin outlet`
     * - `role:owner outlet,outlet:2`
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized.');
        }

        $outletId = null;
        $roleNames = array_values(array_filter(
            $roles,
            function (string $role) use (&$outletId): bool {
                if (preg_match('/^outlet:(\d+)$/', $role, $matches)) {
                    $outletId = (int) $matches[1];

                    return false;
                }

                return true;
            }
        ));

        $hasGlobalRole = $user->role()->whereIn('role', $roleNames)->exists();

        abort_unless($hasGlobalRole, 403, 'Unauthorized.');

        if ($outletId !== null) {
            $roleIds = Role::whereIn('role', $roleNames)->pluck('id');

            $hasOutletRole = $user->outlets()
                ->wherePivot('outlet_id', $outletId)
                ->wherePivotIn('role_id', $roleIds)
                ->exists();

            abort_unless($hasOutletRole, 403, 'Unauthorized.');
        }

        return $next($request);
    }
}
