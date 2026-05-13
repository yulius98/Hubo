<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $outlets = collect();
        $canSelectAll = false;

        if ($user) {
            $user->load('role');
            $roleNames = $user->role->pluck('role')->toArray();

            if (in_array('owner outlet', $roleNames)) {
                $outlets = $user->outlets()->wherePivot('role_id', 2)->get(['outlets.id', 'outlets.nama_outlet']);
                $canSelectAll = true;
            } elseif (in_array('admin outlet', $roleNames)) {
                $outlets = $user->outlets()->wherePivot('role_id', 3)->get(['outlets.id', 'outlets.nama_outlet']);
                $canSelectAll = false;
            } else {
                $outlets = $user->outlets()->get(['outlets.id', 'outlets.nama_outlet']);
                $canSelectAll = $outlets->count() > 1;
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'avatar' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'sidebarOutlets' => $outlets,
            'canSelectAll' => $canSelectAll,
            'selectedOutletId' => $request->session()->get('selected_outlet_id'),
        ];
    }
}
