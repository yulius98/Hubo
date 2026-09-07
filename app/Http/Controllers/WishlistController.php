<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    /**
     * Show the current user's wishlist.
     */
    public function index(Request $request): Response
    {
        $wishlist = $request->user()
            ->wishlist()
            ->with('outlet:id,nama_outlet,slug')
            ->orderByDesc('produk_user.created_at')
            ->get()
            ->map(fn (Produk $produk) => [
                'id' => $produk->id,
                'nama_produk' => $produk->nama_produk,
                'gambar' => $produk->gambar,
                'harga' => $produk->harga_diskon ?? $produk->harga,
                'stok' => $produk->effectiveStock(),
                'slug' => $produk->outlet?->slug,
                'outlet' => $produk->outlet?->nama_outlet,
            ]);

        return Inertia::render('akun_users/wishlist', [
            'products' => $wishlist,
        ]);
    }

    /**
     * Toggle a product in the current user's wishlist.
     */
    public function toggle(Request $request, Produk $produk): RedirectResponse
    {
        $user = $request->user();

        // Only allow wishing for products belonging to a tenant the user may buy from.
        $company = app(TenantService::class)->resolveForUser($user);

        abort_unless($company !== null, 403, 'Belum ada tenant aktif.');

        $belongsToActiveTenant = $produk->outlet()->where('company_id', $company->id)->exists();

        abort_unless($belongsToActiveTenant, 403, 'Produk tidak tersedia.');

        $wishlisted = $user->wishlist()->toggle($produk->id);

        $nowWishlisted = collect($wishlisted['attached'])->isNotEmpty();

        return redirect()->back()->with(
            'success',
            $nowWishlisted
                ? 'Produk ditambahkan ke wishlist.'
                : 'Produk dihapus dari wishlist.',
        );
    }
}
