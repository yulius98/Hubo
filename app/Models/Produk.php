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
        'keterangan',
        'harga',
        'diskon',
        'harga_diskon',

    ];

    public function outlet()
    {
        return $this -> belongsTo(Outlet::class, 'id_outlet');
    }

    public function kategori()
    {
        return $this -> belongsTo(Kategori::class, 'id_kategori');
    }

    public function transaksi(): HasMany
    {
        return $this -> hasMany(Transaksi::class, 'id_produk');
    }

    public function keranjangbelanjauser(): HasMany
    {
        return $this -> hasMany(KeranjangBelanjaUser::class, 'id_produk');
    }

    public function keranjangbelanjakasir(): HasMany
    {
        return $this -> hasMany(KeranjangBelanjaKasir::class, 'id_produk');
    }
}
