<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class KeranjangBelanjaUser extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'id_user',
        'id_kategori',
        'id_produk',
        'jumlah_produk',
        'status',
    ];

    public function user()
    {
        return $this -> belongsTo(User::class, 'id_user');
    }

    public function kategori()
    {
        return $this -> belongsTo(Kategori::class, 'id_kategori');
    }

    public function produk()
    {
        return $this -> belongsTo(Produk::class, 'id_produk');
    }
}
