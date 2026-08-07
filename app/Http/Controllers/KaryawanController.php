<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\RequestRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class KaryawanController extends Controller
{
    /**
     * Display the employee management page for the selected outlet.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');

        $ownedOutletIds = $user->outlets()
            ->wherePivot('role_id', $ownerRoleId)
            ->pluck('outlets.id');

        $selectedOutletId = (int) $request->session()->get('selected_outlet_id', 0);

        $outlet = null;
        $employees = [];
        $pendingRequests = [];

        if ($selectedOutletId && $ownedOutletIds->contains($selectedOutletId)) {
            $outlet = Outlet::find($selectedOutletId);
            $this->authorize('view', $outlet);

            $roles = Role::pluck('role', 'id');

            $employees = $outlet->users()
                ->get(['users.id', 'users.name', 'users.email', 'users.avatar'])
                ->map(fn (User $staffUser) => [
                    'id' => $staffUser->id,
                    'name' => $staffUser->name,
                    'email' => $staffUser->email,
                    'avatar' => $staffUser->avatar,
                    'role_id' => $staffUser->pivot->role_id,
                    'role' => $roles[$staffUser->pivot->role_id] ?? null,
                ])
                ->values()
                ->all();

            $pendingRequests = RequestRole::with(['staff:id,name,email', 'role:id,role'])
                ->where('outlet_id', $outlet->id)
                ->where('status', 'pending')
                ->latest()
                ->get();
        }

        $availableRoles = Role::whereIn('role', ['admin outlet', 'kasir'])
            ->orderBy('id')
            ->get(['id', 'role']);

        return Inertia::render('akun_users/kelola_karyawan', [
            'outlet' => $outlet,
            'employees' => $employees,
            'pendingRequests' => $pendingRequests,
            'roles' => $availableRoles,
            'selectedOutletId' => $selectedOutletId,
        ]);
    }

    /**
     * Update the role of an employee within the selected outlet.
     */
    public function updateRole(Request $request, Outlet $outlet, User $user)
    {
        $this->authorize('update', $outlet);

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $adminRoleId = Role::where('role', 'admin outlet')->value('id');
        $kasirRoleId = Role::where('role', 'kasir')->value('id');
        $userRoleId = Role::where('role', 'user')->value('id');

        $validated = $request->validate([
            'role_id' => ['required', 'integer', Rule::in([$adminRoleId, $kasirRoleId])],
        ]);

        $outletUser = $user->outlets()->wherePivot('outlet_id', $outlet->id)->first();

        if (! $outletUser) {
            throw ValidationException::withMessages([
                'role_id' => 'Karyawan tidak terdaftar di outlet ini.',
            ]);
        }

        if ((int) $outletUser->pivot->role_id === (int) $ownerRoleId) {
            throw ValidationException::withMessages([
                'role_id' => 'Role pemilik outlet tidak dapat diubah.',
            ]);
        }

        $user->outlets()->updateExistingPivot($outlet->id, ['role_id' => $validated['role_id']]);
        $user->role()->syncWithoutDetaching([$validated['role_id']]);

        $remainingRoleIds = $user->outlets()
            ->get()
            ->pluck('pivot.role_id')
            ->unique()
            ->values()
            ->toArray();

        foreach ($user->role()->get() as $role) {
            if ($role->id !== $userRoleId && ! in_array($role->id, $remainingRoleIds)) {
                $user->role()->detach($role->id);
            }
        }

        return redirect()->back()->with('success', 'Role karyawan berhasil diperbarui.');
    }
}
