<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProdukResource;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public REST API — Produk (read only).
 *
 * Scoped ability: `produk:read`
 *
 * @example GET /api/v1/produk?page=1
 * @example GET /api/v1/produk/12
 */
class ProdukController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $outletId = (int) $request->attributes->get('api_outlet_id');

        $produks = Produk::query()
            ->with('kategori:id,kategori')
            ->where('id_outlet', $outletId)
            ->orderBy('nama_produk')
            ->paginate((int) $request->query('per_page', 15));

        return ProdukResource::collection($produks);
    }

    public function show(Request $request, Produk $produk): ProdukResource
    {
        abort_if($produk->id_outlet !== (int) $request->attributes->get('api_outlet_id'), 404);

        $produk->load('kategori:id,kategori');

        return new ProdukResource($produk);
    }
}
