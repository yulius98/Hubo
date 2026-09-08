<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StokResource;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public REST API — Stok (read only).
 *
 * Scoped ability: `stok:read`
 *
 * @example GET /api/v1/stok?page=1
 */
class StokController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $outletId = (int) $request->attributes->get('api_outlet_id');

        $produks = Produk::query()
            ->where('id_outlet', $outletId)
            ->orderBy('nama_produk')
            ->paginate((int) $request->query('per_page', 15));

        return StokResource::collection($produks);
    }
}
