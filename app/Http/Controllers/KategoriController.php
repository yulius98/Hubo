<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class KategoriController extends Controller
{
    private const KATEGORI_PATH = 'app/public/kategoris/';

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $user->load('role');

        $ownerRoleId = Role::where('role', 'owner outlet')->value('id');
        $adminRoleId = Role::where('role', 'admin outlet')->value('id');
        $roleNames = $user->role->pluck('role')->toArray();

        if (in_array('owner outlet', $roleNames)) {
            $accessibleOutlets = $user->outlets()->wherePivot('role_id', $ownerRoleId)->pluck('outlets.id');
        } elseif (in_array('admin outlet', $roleNames)) {
            $accessibleOutlets = $user->outlets()->wherePivot('role_id', $adminRoleId)->pluck('outlets.id');
        } else {
            $accessibleOutlets = collect([]);
        }

        $selectedOutletId = (int) session('selected_outlet_id', 0);

        if ($selectedOutletId && $accessibleOutlets->contains($selectedOutletId)) {
            $this->authorize('viewAny', [Kategori::class, Outlet::find($selectedOutletId)]);
        } else {
            $selectedOutletId = 0;
        }

        $kategori = Kategori::query()
            ->with('outlets:id,nama_outlet')
            ->orderBy('kategori')
            ->get();
        $jmlKategori = $kategori->count();

        return Inertia::render('akun_users/kelola_kategori', [
            'kategoris' => $kategori,
            'jmlKategori' => $jmlKategori,
            'id_user' => $user->id,
            'selectedOutletId' => $selectedOutletId,
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
            'id_user' => 'required|numeric',
            'outlet_ids' => 'nullable|array',
            'outlet_ids.*' => 'integer|exists:outlets,id',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'kategori' => 'required|string|max:255',
        ]);

        $outletIds = array_values(array_unique($validated['outlet_ids'] ?? []));

        if (! empty($outletIds)) {
            $outlets = Outlet::whereIn('id', $outletIds)->get();
            abort_unless($outlets->count() === count($outletIds), 403, 'Outlet tidak ditemukan.');

            foreach ($outlets as $outlet) {
                $this->authorize('create', [Kategori::class, $outlet]);
            }
        }

        if ($request->hasFile('gambar')) {
            $file = $request->file('gambar');
            $kategoriName = Str::slug($validated['kategori']);
            $filename = $kategoriName.'.webp';

            // Proses gambar → konversi ke WebP
            $manager = new ImageManager(new Driver);
            $image = $manager->read($file);

            // Opsional: resize jika mau (contoh max width 1200px)
            $image->scale(width: 200);

            // Encode ke WebP (quality 80 biasanya bagus & ukuran kecil)
            $image->toWebp(80);

            // Simpan langsung ke folder public/outlets
            $destinationPath = storage_path(self::KATEGORI_PATH);

            if (! File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath.'/'.$filename);
            $validated['gambar'] = 'storage/kategoris/'.$filename;
        } else {
            // Jika tidak ada file yang diupload, hapus dari validated
            unset($validated['gambar']);
        }

        unset($validated['outlet_ids']);
        $kategori = Kategori::create($validated);

        if (! empty($outletIds)) {
            $kategori->outlets()->attach($outletIds);
        }

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
     * Save the selected categories for a given outlet.
     */
    public function save(Request $request)
    {
        $validated = $request->validate([
            'outlet_id' => 'required|integer|exists:outlets,id',
            'kategori_ids' => 'nullable|array',
            'kategori_ids.*' => 'integer|exists:kategoris,id',
        ]);

        $outlet = Outlet::findOrFail($validated['outlet_id']);
        $this->authorize('create', [Kategori::class, $outlet]);

        $outlet->kategori()->sync($validated['kategori_ids'] ?? []);

        return redirect()->back()->with('success', 'Kategori outlet berhasil disimpan');
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
            'id_user' => 'required|numeric',
            'outlet_ids' => 'required|array|min:1',
            'outlet_ids.*' => 'integer|exists:outlets,id',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:200',
            'kategori' => 'required|string|max:255',

        ]);

        $this->authorize('update', $kategori);

        $outletIds = array_values(array_unique($validated['outlet_ids']));
        $outlets = Outlet::whereIn('id', $outletIds)->get();
        abort_unless($outlets->count() === count($outletIds), 403, 'Outlet tidak ditemukan.');

        foreach ($outlets as $outlet) {
            $this->authorize('create', [Kategori::class, $outlet]);
        }

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada

            if ($kategori->gambar && file_exists(storage_path(self::KATEGORI_PATH.basename($kategori->gambar)))) {
                unlink(storage_path(self::KATEGORI_PATH.basename($kategori->gambar)));
            }

            $file = $request->file('gambar');
            $kategoriName = Str::slug($validated['kategori'], '-');
            $filename = $kategoriName.'.webp';

            $manager = new ImageManager(new Driver);
            $image = $manager->read($file);
            $image->scale(width: 200);
            $image->toWebp(80);

            // Ensure directory exists
            $destinationPath = storage_path('app/public/kategoris');
            if (! File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true);
            }

            $image->save($destinationPath.'/'.$filename);
            $validated['gambar'] = 'storage/kategoris/'.$filename;
        } else {
            // Jika tidak ada file baru, hapus dari validated agar tidak overwrite
            unset($validated['gambar']);
        }

        // Update data
        unset($validated['outlet_ids']);
        $kategori->update($validated);
        $kategori->outlets()->sync($outletIds);

        return redirect()
            ->back()
            ->with('success', 'Kategori berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kategori $kategori)
    {
        $this->authorize('delete', $kategori);

        // Hapus gambar jika ada
        if ($kategori->gambar && file_exists(storage_path(self::KATEGORI_PATH.basename($kategori->gambar)))) {
            unlink(storage_path(self::KATEGORI_PATH.basename($kategori->gambar)));
        }

        $kategori->delete();

        return redirect()
            ->back()
            ->with('success', 'Kategori berhasil dihapus');
    }
}
