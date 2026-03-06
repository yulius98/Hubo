<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\RequestRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RequestStaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $outlet = Outlet::with('owner') -> get();
        $jmlOutlet = $outlet->count();
        return Inertia::render('akun_users/request_menjadi_staff',[
            'outlets' => $outlet,
            'jmlOutlet' => $jmlOutlet,
            'user_id' => $user->id
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
        //dd($request);
        $validated = $request->validate([
            'id_staff'     => 'required|numeric',
            'id_owner'    => 'required|numeric',
            'id_role'     => 'required|numeric',
            'id_outlet'   => 'required|numeric',
            'status'      => 'required|string',

        ]);

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
