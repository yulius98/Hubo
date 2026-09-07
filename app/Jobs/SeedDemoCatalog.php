<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Outlet;
use App\Models\ProductVariant;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

/**
 * Builds a large demo catalog in the background (used for very large seeding
 * batches so the seeding command stays fast).
 */
class SeedDemoCatalog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 900;

    /**
     * @param  array<int, array<string, mixed>>  $catalog
     */
    public function __construct(
        public int $companyId,
        public int $ownerId,
        public int $outletId,
        public array $catalog,
    ) {}

    /**
     * Seed the catalog products.
     */
    public function handle(): void
    {
        $company = Company::find($this->companyId);
        $outlet = Outlet::find($this->outletId);

        if ($company === null || $outlet === null) {
            return;
        }

        $owner = User::find($this->ownerId);

        foreach ($this->catalog as $item) {
            if ($owner !== null) {
                $kategori = $this->resolveCategory($item['kategori'], $owner, $outlet);
            } else {
                $kategori = Kategori::firstOrCreate(['kategori' => $item['kategori']]);
                $kategori->outlets()->syncWithoutDetaching([$outlet->id]);
            }

            Produk::updateOrCreate(
                ['id_outlet' => $outlet->id, 'sku' => $item['sku']],
                [
                    'id_kategori' => $kategori->id,
                    'nama_produk' => $item['nama_produk'],
                    'keterangan' => 'Produk demo untuk pengembangan.',
                    'harga_beli' => $item['harga_beli'],
                    'margin' => round((($item['harga'] - $item['harga_beli']) / $item['harga_beli']) * 100, 2),
                    'harga' => $item['harga'],
                    'ppn' => 11,
                    'tax' => 'include tax',
                    'diskon' => 'no',
                    'harga_diskon' => null,
                    'stok' => $item['stok'],
                    'min_stok' => 5,
                ]
            );

            ProductVariant::updateOrCreate(
                ['produk_id' => Produk::where('id_outlet', $outlet->id)->where('sku', $item['sku'])->value('id'), 'nama' => 'Standar'],
                ['sku' => $item['sku'].'-S', 'harga' => $item['harga'], 'stok' => $item['stok'], 'is_active' => true]
            );
        }
    }

    private function resolveCategory(string $name, User $owner, Outlet $outlet): Kategori
    {
        $kategori = Kategori::firstOrCreate(
            ['id_user' => $owner->id, 'kategori' => $name],
            ['gambar' => 'storage/kategoris/'.Str::slug($name).'.webp']
        );

        $kategori->outlets()->syncWithoutDetaching([$outlet->id]);

        return $kategori;
    }
}
