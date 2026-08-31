<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Produk extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'id_outlet',
        'id_kategori',
        'gambar',
        'nama_produk',
        'sku',
        'keterangan',
        'harga_beli',
        'margin',
        'harga',
        'ppn',
        'tax',
        'diskon',
        'harga_diskon',
        'stok',
        'min_stok',
        'rating',
    ];

    protected function casts(): array
    {
        return [
            'stok' => 'integer',
            'min_stok' => 'integer',
            'rating' => 'float',
            'ppn' => 'float',
        ];
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class, 'id_outlet');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'produk_id');
    }

    public function activeVariants(): HasMany
    {
        return $this->variants()->where('is_active', true);
    }

    /**
     * Effective stock: sum of active variant stock when variants exist,
     * otherwise the produk stock column itself.
     */
    public function effectiveStock(): int
    {
        if (! $this->relationLoaded('variants')) {
            $this->load('variants');
        }

        $variants = $this->variants->filter(fn (ProductVariant $v) => $v->is_active);

        if ($variants->isNotEmpty()) {
            return (int) $variants->sum('stok');
        }

        return (int) $this->stok;
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'id_kategori');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_produk');
    }

    public function keranjangbelanjauser(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaUser::class, 'id_produk');
    }

    public function keranjangbelanjakasir(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaKasir::class, 'id_produk');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->reviews()->where('is_approved', true);
    }

    /**
     * Recompute the aggregate rating stored on the produk row from reviews.
     */
    public function recalculateRating(): void
    {
        $average = $this->reviews()->where('is_approved', true)->avg('rating');

        $this->forceFill([
            'rating' => $average !== null ? round((float) $average, 2) : 0,
        ])->save();
    }
}
