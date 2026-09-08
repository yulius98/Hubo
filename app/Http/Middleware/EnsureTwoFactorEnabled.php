<?php

namespace App\Http\Middleware;

use App\Services\TwoFactorService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Block authenticated users — owners/admins of a tenant that enforces 2FA —
 * until they have configured two-factor authentication. The security setup
 * routes themselves are always reachable.
 */
class EnsureTwoFactorEnabled
{
    public function __construct(protected TwoFactorService $twoFactor) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $this->twoFactor->requiresTwoFactor($user)) {
            return $next($request);
        }

        if ($this->twoFactor->isEnabled($user) || $request->routeIs('settings.security*')) {
            return $next($request);
        }

        return redirect()->route('settings.security')
            ->with('warning', 'Kebijakan keamanan usaha mewajibkan autentikasi dua faktor sebelum melanjutkan.');
    }
}
