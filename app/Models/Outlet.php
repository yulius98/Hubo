<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Outlet extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'gambar',
        'nama_outlet',
        'alamat_outlet',
        'kota',
        'telp',
    ];

    public function user()
    {
        return $this->belongsToMany(User::class)
        ->withTimestamps();
    }

    public function produk(): HasMany
    {
        return $this -> hasMany(Produk::class, 'id_outlet');
    }

    public function transaksi(): HasMany
    {
        return $this -> hasMany(Transaksi::class, 'id_outlet');
    }

    public function owner()
    {
        return $this->belongsToMany(User::class)
            ->whereHas('role', function ($q) {
                $q->where('role', 'owner outlet');
            });
    }

    public function requestRoles()
    {
        return $this->hasMany(RequestRole::class, 'id_outlet');
    }
}
