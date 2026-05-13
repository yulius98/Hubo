<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\RequestRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $outlet = Outlet::with('owner')->get();
        $jmlOutlet = $outlet->count();
        $statusreq = RequestRole::with([
            'owner:id,name',
            'outlet:id,nama_outlet',
        ])
            ->where('user_id', Auth::id())
            ->get();

        $userOutletRoles = $user->outlets()
            ->get()
            ->pluck('pivot.role_id')
            ->unique()
            ->values()
            ->toArray();

        return Inertia::render('akun_users/request_menjadi_staff', [
            'outlets' => $outlet,
            'jmlOutlet' => $jmlOutlet,
            'user_id' => $user->id,
            'statusreq' => $statusreq,
            'userOutletRoles' => $userOutletRoles,
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
        $validated = $request->validate([
            'user_id' => 'required|numeric',
            'owner_id' => 'required|numeric',
            'role_id' => 'required|numeric|in:3,5',
            'outlet_id' => 'required|numeric',
            'status' => 'required|string',
        ]);

        $user = Auth::user();
        $roleId = (int) $validated['role_id'];

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

        $isKasir = in_array(5, $allUserRoleIds);
        $isAdmin = in_array(3, $allUserRoleIds);
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

        if ($roleId === 5 && $isKasir) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi kasir di salah satu outlet dan tidak dapat mengajukan menjadi kasir lagi.',
            ]);
        }

        if ($roleId === 5 && $isAdmin) {
            throw ValidationException::withMessages([
                'role_id' => 'Anda sudah menjadi admin dan tidak bisa mengajukan menjadi kasir.',
            ]);
        }

        if ($roleId === 3 && $isKasir) {
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
