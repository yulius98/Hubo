<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;

class OutletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $dtoutlet = Auth::user()->outlet;
        $jmloutlet = count($dtoutlet);
        return Inertia::render('akun_users/outlet_user_page',['outlets' => $dtoutlet, 'jmlOutlet' => $jmloutlet]);
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
            'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'nama_outlet'   => 'required|string|max:255',
            'alamat_outlet' => 'required|string',
            'kota'          => 'required|string|max:255',
            'telp'          => 'required|string|max:20',
        ]);

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $outletName = Str::slug($validated['nama_outlet']); // nama-produk
            $filename = $outletName . '.webp';

            // Proses gambar → konversi ke WebP
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);

            // Opsional: resize jika mau (contoh max width 1200px)
            $image->scale(width: 200);

            // Encode ke WebP (quality 80 biasanya bagus & ukuran kecil)
            $image->toWebp(80);

            // Simpan langsung ke folder public/outlets
            $destinationPath = storage_path('app/public/outlets');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath . '/' . $filename);
            $validated['gambar'] = 'storage/outlets/' . $filename;
        } else {
            // Jika tidak ada file yang diupload, hapus dari validated
            unset($validated['gambar']);
        }

        $outlet = Outlet::create($validated);
        $user = Auth::user();
        $user->outlet()->attach($outlet->id);
        $user->role()->syncWithoutDetaching([2]);


        return redirect()->back()->with('success', 'Outlet berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(Outlet $outlet)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Outlet $outlet)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Outlet $outlet)
    {
        // Validasi dulu (wajib)
        $validated = $request->validate([
            'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'nama_outlet'   => 'required|string|max:255',
            'alamat_outlet' => 'required|string',
            'kota'          => 'required|string|max:255',
            'telp'       => 'required|string|max:20',
        ]);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada
            if ($outlet->gambar && file_exists(storage_path('app/public/outlets/' . basename($outlet->gambar)))) {
                unlink(storage_path('app/public/outlets/' . basename($outlet->gambar)));
            }

            $file = $request->file('gambar');
            $outletName = Str::slug($validated['nama_outlet']);
            $filename = $outletName . '.webp';

            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);
            $image->scale(width: 200);
            $image->toWebp(80);

            // Ensure directory exists
            $destinationPath = storage_path('app/public/outlets');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath . '/' . $filename);
            $validated['gambar'] = 'storage/outlets/' . $filename;
        } else {
            // Jika tidak ada file baru, hapus dari validated agar tidak overwrite
            unset($validated['gambar']);
        }

        // Update data
        $outlet->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Outlet berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Outlet $outlet)
    {
        // Hapus gambar jika ada
        if ($outlet->gambar && file_exists(storage_path('app/public/outlets/' . basename($outlet->gambar)))) {
            unlink(storage_path('app/public/outlets/' . basename($outlet->gambar)));
        }

        $outlet->delete();

        return redirect()
            ->back()
            ->with('success', 'Outlet berhasil dihapus');
    }
}
