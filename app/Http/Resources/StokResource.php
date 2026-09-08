<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StokResource extends JsonResource
{
    /**
     * Transform the product stock resource for the public API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_produk' => $this->nama_produk,
            'sku' => $this->sku,
            'stok' => $this->stok,
            'min_stok' => $this->min_stok,
            'status' => $this->stok <= $this->min_stok
                ? 'low'
                : ($this->stok === 0 ? 'out_of_stock' : 'in_stock'),
        ];
    }
}
