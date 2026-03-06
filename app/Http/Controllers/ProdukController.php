<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Produk;
use App\Models\Outlet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;

class ProdukController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index($outlet_id)
    {
        $outlet = Outlet::findOrFail($outlet_id);
        $kategori = Kategori::all();
        $produk = Produk::where('id_outlet', $outlet_id)
                ->with('kategori')
                ->paginate(10);
        $jmlProduk = $produk->total();

        return Inertia::render('akun_users/produk_user_page',[
            'outlet'    => $outlet,
            'kategori'  => $kategori,
            'produk'    => $produk,
            'jmlProduk' => $jmlProduk,
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
                'id_outlet'     => 'required|numeric',
                'id_kategori'   =>  'required|numeric',
                'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
                'nama_produk'   => 'required|string|max:255',
                'keterangan'    => 'nullable|string',
                'harga'         => 'required|numeric',
                'diskon'        => 'required|string',
                'harga_diskon'  => 'nullable|numeric',
            ]);

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $produkName = Str::slug($validated['nama_produk']); // nama-produk
            $filename = $produkName . '.webp';

            // Proses gambar → konversi ke WebP
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file);

            // Opsional: resize jika mau (contoh max width 1200px)
            $image->scale(width: 200);

            // Encode ke WebP (quality 80 biasanya bagus & ukuran kecil)
            $image->toWebp(80);

            // Simpan langsung ke folder public/outlets
            $destinationPath = storage_path('app/public/produks');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath . '/' . $filename);
            $validated['gambar'] = 'storage/produks/' . $filename;
        } else {
            // Jika tidak ada file yang diupload, hapus dari validated
            unset($validated['gambar']);
        }

        Produk::create($validated);

        return redirect()->back()->with('success', 'Produk berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(Produk $produk)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Produk $produk)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'id_outlet'     => 'required|numeric',
            'id_kategori'   =>  'required|numeric',
            'gambar'        => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'nama_produk'   => 'required|string|max:255',
            'keterangan'    => 'nullable|string',
            'harga'         => 'required|numeric',
            'diskon'        => 'required|string',
            'harga_diskon'  => 'nullable|numeric',
        ]);

        //dd($validated);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada
            if ($produk->gambar && file_exists(storage_path('app/public/produks/' . basename($produk->gambar)))) {
                unlink(storage_path('app/public/produks/' . basename($produk->gambar)));
            }

            $file = $request->file('gambar');
            $produkName = Str::slug($validated['nama_produk'],'-');
            $filename = $produkName . '.webp';

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
        $produk->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Produk $produk)
    {
        // Hapus gambar jika ada
        if ($produk->gambar && file_exists(storage_path('app/public/produks/' . basename($produk->gambar)))) {
            unlink(storage_path('app/public/produks/' . basename($produk->gambar)));
        }

        $produk->delete();

        return redirect()
            ->back()
            ->with('success', 'Outlet berhasil dihapus');
    }
}
