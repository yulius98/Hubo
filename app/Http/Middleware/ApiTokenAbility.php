<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAbility
{
    /**
     * Resolve the outlet bound to the Sanctum token from its abilities and
     * require the given scoped permission for it.
     *
     * Token abilities are stored in the form `store:{outletId}:{ability}` so a
     * single token can only ever access the outlet it was issued for.
     */
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $user = $request->user();

        if (! $user || ! $user->currentAccessToken()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $outletId = $this->outletIdFromToken($user->currentAccessToken()->abilities);

        if ($outletId === null || ! $user->tokenCan("store:{$outletId}:{$ability}")) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->attributes->set('api_outlet_id', $outletId);

        return $next($request);
    }

    /**
     * @param  array<int, string>  $abilities
     */
    private function outletIdFromToken(array $abilities): ?int
    {
        foreach ($abilities as $ability) {
            if (preg_match('/^store:(\d+):/', $ability, $matches)) {
                return (int) $matches[1];
            }
        }

        return null;
    }
}
