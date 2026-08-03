<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ProdukController extends Controller
{
    private const PRODUK_IMAGE_PATH = 'app/public/produks/';

    /**
     * Display a listing of the resource.
     */
    public function index(string $outlet_id)
    {
        if ($outlet_id === 'all' || (int) $outlet_id === 0) {
            $userOutletIds = Auth::user()->outlets->pluck('id');

            $kategori = Kategori::whereIn('id_outlet', $userOutletIds)->get();

            $produk = Produk::with('kategori:id,kategori')
                ->whereIn('id_outlet', $userOutletIds)
                ->paginate(10);

            $jmlProduk = $produk->total();

            return Inertia::render('akun_users/produk_user_page', [
                'outlet' => (object) ['id' => 0, 'nama_outlet' => 'All Outlet'],
                'kategori' => $kategori,
                'produk' => $produk,
                'jmlProduk' => $jmlProduk,
            ]);
        }

        $outlet = Outlet::findOrFail($outlet_id);
        $this->authorize('viewAny', [Produk::class, $outlet]);

        $kategori = Kategori::where('id_outlet', $outlet->id)->get();

        $produk = Produk::with('kategori:id,kategori')
            ->where('id_outlet', $outlet->id)
            ->paginate(10);

        $jmlProduk = $produk->total();

        return Inertia::render('akun_users/produk_user_page', [
            'outlet' => $outlet,
            'kategori' => $kategori,
            'produk' => $produk,
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
            'id_outlet' => 'required|numeric',
            'id_kategori' => 'required|numeric',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'nama_produk' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'harga' => 'required|numeric',
            'diskon' => 'required|string',
            'harga_diskon' => 'nullable|numeric',
        ]);

        $outlet = Outlet::findOrFail($validated['id_outlet']);
        $this->authorize('create', [Produk::class, $outlet]);

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $produkName = Str::slug($validated['nama_produk']); // nama-produk
            $filename = $produkName.'.webp';

            // Proses gambar → konversi ke WebP
            $manager = new ImageManager(new Driver);
            $image = $manager->read($file);

            // Opsional: resize jika mau (contoh max width 1200px)
            $image->scale(width: 200);

            // Encode ke WebP (quality 80 biasanya bagus & ukuran kecil)
            $image->toWebp(80);

            // Simpan langsung ke folder public/outlets
            $destinationPath = storage_path(self::PRODUK_IMAGE_PATH);

            if (! File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath.basename($filename));
            $validated['gambar'] = 'storage/produks/'.$filename;
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
        $produk->load('kategori:id,kategori');

        return Inertia::render('produk/detail', [
            'product' => $produk,
            'user' => Auth::check() ? Auth::user() : null,
        ]);
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
            'id_outlet' => 'required|numeric',
            'id_kategori' => 'required|numeric',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'nama_produk' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'harga' => 'required|numeric',
            'diskon' => 'required|string',
            'harga_diskon' => 'nullable|numeric',
        ]);

        $this->authorize('update', $produk);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada
            if ($produk->gambar && file_exists(storage_path(self::PRODUK_IMAGE_PATH.basename($produk->gambar)))) {
                unlink(storage_path(self::PRODUK_IMAGE_PATH.basename($produk->gambar)));
            }

            $file = $request->file('gambar');
            $produkName = Str::slug($validated['nama_produk'], '-');
            $filename = $produkName.'.webp';

            $manager = new ImageManager(new Driver);
            $image = $manager->read($file);
            $image->scale(width: 200);
            $image->toWebp(80);

            // Ensure directory exists
            $destinationPath = storage_path(self::PRODUK_IMAGE_PATH);
            if (! File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath.basename($filename));
            $validated['gambar'] = 'storage/outlets/'.$filename;
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
        $this->authorize('delete', $produk);

        // Hapus gambar jika ada
        if ($produk->gambar && file_exists(storage_path(self::PRODUK_IMAGE_PATH.basename($produk->gambar)))) {
            unlink(storage_path(self::PRODUK_IMAGE_PATH.basename($produk->gambar)));
        }

        $produk->delete();

        return redirect()
            ->back()
            ->with('success', 'Outlet berhasil dihapus');
    }
}
