<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CreateApiTokenRequest;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manage Sanctum personal access tokens for the public REST API (G3).
 *
 * Tokens are always bound to one of the owner's outlets through their
 * abilities (`store:{outletId}:{scope}`). The plain-text token is returned
 * exactly once after creation.
 */
class ApiTokenController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $outlets = $user->outlets()
            ->get(['outlets.id', 'outlets.nama_outlet'])
            ->map(fn (Outlet $outlet) => [
                'id' => $outlet->id,
                'nama_outlet' => $outlet->nama_outlet,
            ])
            ->values()
            ->all();

        $tokens = $user->tokens()
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'abilities' => $token->abilities,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return Inertia::render('settings/api-integrations', [
            'outlets' => $outlets,
            'tokens' => $tokens,
            'abilities' => [
                ['key' => 'produk:read', 'label' => 'Read Produk'],
                ['key' => 'stok:read', 'label' => 'Read Stok'],
                ['key' => 'order:read', 'label' => 'Read Order'],
                ['key' => 'order:update', 'label' => 'Update Order'],
            ],
        ]);
    }

    public function store(CreateApiTokenRequest $request)
    {
        $user = $request->user();

        $outletId = (int) $request->validated('outlet_id');

        $owned = $user->outlets()->whereKey($outletId)->exists();

        abort_unless($owned, 403, 'Anda bukan pemilik outlet tersebut.');

        $abilities = collect($request->validated('abilities'))
            ->map(fn (string $ability) => "store:{$outletId}:{$ability}")
            ->all();

        $token = $user->createToken($request->validated('name'), $abilities);

        return back()->with([
            'apiToken' => $token->plainTextToken,
            'apiTokenName' => $request->validated('name'),
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $tokenId = (int) $request->validate(['token_id' => ['required', 'integer']])['token_id'];

        $request->user()->tokens()
            ->whereKey($tokenId)
            ->delete();

        return back();
    }
}
