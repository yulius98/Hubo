<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Kategori extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'id_user',
        'id_outlet',
        'gambar',
        'kategori',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'id_outlet');
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class, 'id_kategori');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_kategori');
    }

    public function keranjangbelanjauser(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaUser::class, 'id_kategori');
    }

    public function keranjangbelanjakasir(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaKasir::class, 'id_kategori');
    }
}
