<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\RequestRole;
use App\Models\Role;
use App\Models\User;
use App\Notifications\StaffRequestNotification;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequestRoleController extends Controller
{
    public function __construct(protected SubscriptionService $subscriptions) {}

    /**
     * Display a listing of the resource.
     */
    public function index($outlet_id)
    {
        $outlet = Outlet::findOrFail($outlet_id);
        $this->authorize('viewAny', [RequestRole::class, $outlet]);

        $add_staff = RequestRole::with([
            'staff:id,name',
            'role:id,role',
        ])
            ->where('outlet_id', $outlet_id)
            ->where('status', 'pending')
            ->get();

        $roles = Role::pluck('role', 'id');
        $staff = $outlet->users()
            ->get(['users.id', 'users.name'])
            ->map(fn (User $staffUser) => [
                'id' => $staffUser->id,
                'name' => $staffUser->name,
                'role' => $roles[$staffUser->pivot->role_id] ?? null,
            ])
            ->values();

        return Inertia::render('akun_users/tambah_staff', ['add_staff' => $add_staff, 'staff' => $staff, 'outlet_id' => $outlet->id]);
    }

    public function terima($id)
    {
        $data_staf = RequestRole::findOrFail($id);
        $this->authorize('approve', $data_staf);

        if ($data_staf->status !== 'pending') {
            return redirect()->back()->with('error', 'Request sudah diproses.');
        }

        if ($data_staf->outlet->company !== null) {
            $this->subscriptions->assertCanCreate(
                $data_staf->outlet->company,
                SubscriptionService::RESOURCE_STAFF
            );
        }

        $user = User::findOrFail($data_staf->user_id);

        // Ganti role lama di outlet yang sama agar tidak ada konflik.
        $user->outlets()->detach($data_staf->outlet_id);
        $user->outlets()->attach(
            $data_staf->outlet_id,
            ['role_id' => $data_staf->role_id]
        );

        RequestRole::where('id', $id)
            ->update([
                'status' => 'done',
            ]);

        $user->role()->syncWithoutDetaching([$data_staf->role_id]);

        $user->notify(new StaffRequestNotification($data_staf->outlet, 'accepted'));

        return redirect()->back()->with('success', 'Request berhasil dikirim');

    }

    public function tolak($id)
    {
        $data_staf = RequestRole::findOrFail($id);
        $this->authorize('reject', $data_staf);

        RequestRole::where('id', $id)
            ->update([
                'status' => 'reject',
            ]);

        $user = User::find($data_staf->user_id);
        $user?->notify(new StaffRequestNotification($data_staf->outlet, 'rejected'));

        return redirect()->back()->with('success', 'Request berhasil ditolak');

    }

    public function removeStaff(Request $request, Outlet $outlet)
    {
        $this->authorize('update', $outlet);

        $validated = $request->validate([
            'staff_id' => 'required|exists:users,id',
        ]);

        $staff = User::findOrFail($validated['staff_id']);

        if ($staff->hasOutletRole($outlet, 'owner outlet')) {
            return redirect()->back()->with('error', 'Owner tidak dapat dihapus dari outlet-nya sendiri.');
        }

        $staff->outlets()->detach($outlet->id);

        $remainingRoleIds = $staff->outlets()
            ->get()
            ->pluck('pivot.role_id')
            ->unique()
            ->values()
            ->toArray();

        $userRoleId = Role::where('role', 'user')->value('id');

        foreach ($staff->role()->get() as $role) {
            if ($role->id !== $userRoleId && ! in_array($role->id, $remainingRoleIds)) {
                $staff->role()->detach($role->id);
            }
        }

        return redirect()->back()->with('success', 'Staff berhasil dihapus dari outlet.');
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(RequestRole $requestRole)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RequestRole $requestRole)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RequestRole $requestRole)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RequestRole $requestRole)
    {
        //
    }
}
