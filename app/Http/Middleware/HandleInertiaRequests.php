<?php

namespace App\Http\Middleware;

use App\Models\RequestRole;
use App\Models\Role;
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
        $pendingRequestCount = 0;
        $pendingRequestList = [];

        if ($user) {
            $user->load('role');
            $roleNames = $user->role->pluck('role')->toArray();
            $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
            $adminRoleId = Role::where('role', 'admin outlet')->value('id');

            if (in_array('owner outlet', $roleNames)) {
                $pendingRequestList = RequestRole::with(['staff:id,name', 'outlet:id,nama_outlet'])
                    ->where('owner_id', $user->id)
                    ->where('status', 'pending')
                    ->latest()
                    ->get(['id', 'user_id', 'outlet_id'])
                    ->map(fn (RequestRole $requestRole) => [
                        'id' => $requestRole->id,
                        'staff_name' => $requestRole->staff?->name ?? '—',
                        'outlet_name' => $requestRole->outlet?->nama_outlet ?? '—',
                    ])
                    ->values()
                    ->all();

                $pendingRequestCount = count($pendingRequestList);
            }

            if (in_array('owner outlet', $roleNames)) {
                $outlets = $user->outlets()->wherePivot('role_id', $ownerRoleId)->get(['outlets.id', 'outlets.nama_outlet']);
                $canSelectAll = true;
            } elseif (in_array('admin outlet', $roleNames)) {
                $outlets = $user->outlets()->wherePivot('role_id', $adminRoleId)->get(['outlets.id', 'outlets.nama_outlet']);
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
            'pendingRequestCount' => $pendingRequestCount,
            'pendingRequestList' => $pendingRequestList,
            'locale' => $request->session()->get('locale', 'id'),
        ];
    }
}
