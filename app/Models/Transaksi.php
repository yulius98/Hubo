<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Transaksi extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'tgl_transaksi',
        'id_user',
        'id_outlet',
        'id_kategori',
        'id_produk',
        'jenis_transaksi',
        'jumlah_produk',
    ];

    public function user()
    {
        return $this -> belongsTo(User::class,'id_user');
    }

    public function outlet()
    {
        return $this -> belongsTo(Outlet::class,'id_outlet');
    }

    public function kategori()
    {
        return $this -> belongsTo(Kategori::class,'id_kategori');
    }

    public function produk()
    {
        return $this -> belongsTo(Produk::class, 'id_produk');
    }
}
