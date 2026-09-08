<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProdukResource extends JsonResource
{
    /**
     * Transform the product resource for the public API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_produk' => $this->nama_produk,
            'sku' => $this->sku,
            'kategori' => $this->whenLoaded('kategori', fn () => $this->kategori?->kategori),
            'gambar' => $this->gambar,
            'keterangan' => $this->keterangan,
            'harga' => (float) $this->harga,
            'harga_beli' => (float) $this->harga_beli,
            'margin' => (float) $this->margin,
            'diskon' => $this->diskon,
            'harga_diskon' => $this->harga_diskon !== null ? (float) $this->harga_diskon : null,
            'ppn' => $this->ppn !== null ? (float) $this->ppn : 0.0,
            'stok' => $this->stok,
            'min_stok' => $this->min_stok,
            'rating' => $this->rating,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
