<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;


class KategoriController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $kategori = Kategori::paginate(10);
        $user = Auth::user();
        $jmlKategori = $kategori->total();
        return Inertia::render('akun_admin_app/kelola_kategori',['kategoris' => $kategori, 'jmlKategori' => $jmlKategori, 'id_user' => $user->id]);
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
            'id_user'       => 'required|numeric',
            'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'kategori'      => 'required|string|max:255',
        ]);

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $kategoriName = Str::slug($validated['kategori']);
            $filename = $kategoriName . '.webp';

            // Proses gambar → konversi ke WebP
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);

            // Opsional: resize jika mau (contoh max width 1200px)
            $image->scale(width: 200);

            // Encode ke WebP (quality 80 biasanya bagus & ukuran kecil)
            $image->toWebp(80);

            // Simpan langsung ke folder public/outlets
            $destinationPath = storage_path('app/public/kategoris');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath . '/' . $filename);
            $validated['gambar'] = 'storage/kategoris/' . $filename;
        } else {
            // Jika tidak ada file yang diupload, hapus dari validated
            unset($validated['gambar']);
        }

        Kategori::create($validated);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(Kategori $kategori)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Kategori $kategori)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kategori $kategori)
    {
        // Validasi dulu (wajib)
        $validated = $request->validate([
            'id_user'       => 'required|numeric',
            'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'kategori'      => 'required|string|max:255',

        ]);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada

            if ($kategori->gambar && file_exists(storage_path('app/public/kategoris/' . basename($kategori->gambar)))) {
                unlink(storage_path('app/public/kategoris/' . basename($kategori->gambar)));
            }

            $file = $request->file('gambar');
            $kategoriName = Str::slug($validated['kategori'],'-');
            $filename = $kategoriName . '.webp';

            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);
            $image->scale(width: 200);
            $image->toWebp(80);

            // Ensure directory exists
            $destinationPath = storage_path('app/public/kategoris');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath . '/' . $filename);
            $validated['gambar'] = 'storage/kategoris/' . $filename;
        } else {
            // Jika tidak ada file baru, hapus dari validated agar tidak overwrite
            unset($validated['gambar']);
        }

        // Update data
        $kategori->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Kategori berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kategori $kategori)
    {
        // Hapus gambar jika ada
        if ($kategori->gambar && file_exists(storage_path('app/public/kategoris/' . basename($kategori->gambar)))) {
            unlink(storage_path('app/public/kategoris/' . basename($kategori->gambar)));
        }

        $kategori->delete();

        return redirect()
            ->back()
            ->with('success', 'Kategori berhasil dihapus');
    }
}
