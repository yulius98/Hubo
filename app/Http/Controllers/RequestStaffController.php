<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\RequestRole;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class RequestStaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $outlet = Outlet::with('owner')->get();
        $jmlOutlet = $outlet->count();
        $statusreq = RequestRole::with([
            'owner:id,name',
            'outlet:id,nama_outlet',
        ])
            ->where('user_id', Auth::id())
            ->get();

        $userRoles = $user->role()
            ->pluck('role')
            ->toArray();

        $adminRoleId = Role::where('role', 'admin outlet')->value('id');
        $kasirRoleId = Role::where('role', 'kasir')->value('id');

        $pendingRequests = collect();

        if (in_array('owner outlet', $userRoles)) {
            $pendingRequests = RequestRole::with([
                'staff:id,name',
                'outlet:id,nama_outlet',
                'role:id,role',
            ])
                ->where('owner_id', $user->id)
                ->where('status', 'pending')
                ->latest()
                ->get();
        }

        return Inertia::render('akun_users/request_menjadi_staff', [
            'outlets' => $outlet,
            'jmlOutlet' => $jmlOutlet,
            'user_id' => $user->id,
            'statusreq' => $statusreq,
            'userRoles' => $userRoles,
            'adminRoleId' => $adminRoleId,
            'kasirRoleId' => $kasirRoleId,
            'pendingRequests' => $pendingRequests,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $adminRoleId = Role::where('role', 'admin outlet')->value('id');
        $kasirRoleId = Role::where('role', 'kasir')->value('id');

        $validated = $request->validate([
            'user_id' => 'required|numeric',
            'owner_id' => 'required|numeric',
            'role_id' => ['required', 'numeric', Rule::in([$adminRoleId, $kasirRoleId])],
            'outlet_id' => 'required|numeric',
            'status' => 'required|string',
        ]);

        $roleId = (int) $validated['role_id'];

        $outlet = Outlet::with('owner')->find($validated['outlet_id']);
        $actualOwner = $outlet?->owner->first();

        if (! $actualOwner || (int) $actualOwner->id !== (int) $validated['owner_id']) {
            throw ValidationException::withMessages([
                'owner_id' => 'Pemilik outlet yang dipilih tidak valid.',
            ]);
        }

        $userOutletRoles = $user->outlets()
            ->get()
            ->pluck('pivot.role_id')
            ->unique()
            ->values()
            ->toArray();

        $userGlobalRoles = $user->role()
            ->get()
            ->pluck('id')
            ->toArray();

        $allUserRoleIds = array_unique(array_merge($userOutletRoles, $userGlobalRoles));

        $isOwner = in_array($ownerRoleId, $allUserRoleIds);
        $isKasir = in_array($kasirRoleId, $allUserRoleIds);
        $isAdmin = in_array($adminRoleId, $allUserRoleIds);

        $hasPending = RequestRole::where('user_id', $user->id)
            ->where('outlet_id', $validated['outlet_id'])
            ->where('role_id', $roleId)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah memiliki pengajuan pending untuk role ini di outlet yang sama.',
            ]);
        }

        if ($isOwner) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi owner outlet dan tidak dapat mengajukan menjadi karyawan.',
            ]);
        }

        if ($roleId === $kasirRoleId && $isKasir) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi kasir di salah satu outlet dan tidak dapat mengajukan menjadi kasir lagi.',
            ]);
        }

        if ($roleId === $kasirRoleId && $isAdmin) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi admin dan tidak bisa mengajukan menjadi kasir.',
            ]);
        }

        if ($roleId === $adminRoleId && $isKasir) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi kasir dan tidak bisa mengajukan menjadi admin.',
            ]);
        }

        RequestRole::create($validated);

        return redirect()->back()->with('success', 'Request berhasil dikirim');

    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
