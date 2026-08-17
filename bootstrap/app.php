<?php

use App\Http\Middleware\EnsureQuota;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->validateCsrfTokens(except: [
            'api/webhooks/*',
        ]);

        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'quota' => EnsureQuota::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            SetTenantContext::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            $renderable = [403, 404, 419];

            if (app()->environment('production')) {
                $renderable = array_merge($renderable, [500, 503]);
            }

            if (! in_array($status, $renderable, true)) {
                return $response;
            }

            Inertia::version(fn (Request $request) => app(HandleInertiaRequests::class)->version($request));

            $messages = [
                403 => 'Anda tidak memiliki izin untuk mengakses halaman ini.',
                404 => 'Halaman yang Anda cari tidak ditemukan.',
                419 => 'Sesi Anda telah berakhir. Silakan muat ulang halaman.',
                500 => 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
                503 => 'Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti.',
            ];

            $message = $messages[$status];

            if ($status === 403
                && $exception instanceof HttpException
                && ! in_array($exception->getMessage(), ['', 'Unauthorized.', 'Unauthorized'], true)) {
                $message = $exception->getMessage();
            }

            return Inertia::render('error', [
                'status' => $status,
                'message' => $message,
            ])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();
