<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    /**
     * Display the public storefront for an outlet by its slug.
     */
    public function index(Request $request, string $slug): Response
    {
        $outlet = Cache::remember(
            'storefront.outlet.'.md5($slug),
            300,
            fn () => Outlet::query()
                ->where('slug', $slug)
                ->with('company')
                ->firstOrFail(),
        );

        $search = trim((string) $request->query('q', ''));
        $kategoriId = (int) $request->query('kategori', 0);

        $kategoris = Cache::remember(
            'storefront.kategoris.'.$outlet->id,
            300,
            fn () => Kategori::whereHas('outlets', fn ($query) => $query->where('outlets.id', $outlet->id))
                ->get(['id', 'kategori', 'gambar']),
        );

        $products = Produk::query()
            ->with('kategori:id,kategori')
            ->with('variants')
            ->where('id_outlet', $outlet->id)
            ->where(function ($query) use ($search, $kategoriId) {
                $query->when($search !== '', fn ($q) => $q->where('nama_produk', 'like', '%'.$search.'%'))
                    ->when($kategoriId > 0, fn ($q) => $q->where('id_kategori', $kategoriId));
            })
            ->where(function ($query) {
                $query->where(fn ($q) => $q->whereHas('activeVariants', fn ($variants) => $variants->where('stok', '>', 0)))
                    ->orWhere(fn ($q) => $q->whereDoesntHave('activeVariants')->where('stok', '>', 0));
            })
            ->paginate(12)
            ->withQueryString();

        $products->getCollection()->transform(fn (Produk $produk) => $produk
            ->setAttribute(
                'display_price',
                $produk->variants->firstWhere('is_active', true)?->harga
                    ?? $produk->harga_diskon
                    ?? (float) $produk->harga
            ));

        return Inertia::render('storefront/index', [
            'outlet' => $outlet->only('id', 'nama_outlet', 'slug', 'gambar', 'alamat_outlet', 'kota', 'telp'),
            'kategoris' => $kategoris,
            'products' => $products,
            'search' => $search,
            'selectedKategori' => $kategoriId,
        ]);
    }
}
