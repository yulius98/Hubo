<?php

namespace App\Http\Controllers;

use App\Models\RequestRole;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;


class RequestRoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index($outlet_id)
    {

        $add_staff = RequestRole::with([
            'staff:id,name',
            'role:id,role'
        ])
        -> where ('outlet_id', $outlet_id)
        -> where ('status', 'pending')
        -> get();

        return inertia::render('akun_users/tambah_staff',['add_staff' => $add_staff]);
    }

    public function terima($id)
    {
        $data_staf = RequestRole::findOrFail($id);
        $user = User::findOrFail($data_staf->user_id);
        $user->outlets()->attach(
            $data_staf->outlet_id,
            ['role_id' => $data_staf->role_id]
        );

        RequestRole::where('id', $id)
        ->update([
            'status' => 'done',
        ]);

        $user->role()->attach(
            $data_staf->user_id,
            ['role_id' => $data_staf->role_id]
        );



        return redirect()->back()->with('success', 'Request berhasil dikirim');

    }

    public function tolak($id)
    {

        RequestRole::where('id', $id)
        ->update([
            'status' => 'reject',
        ]);

        return redirect()->back()->with('success', 'Request berhasil ditolak');

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
