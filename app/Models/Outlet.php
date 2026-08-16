<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'company_id',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'outlet_user')
            ->withPivot('role_id')
            ->withTimestamps();
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class, 'id_outlet');
    }

    public function kategori(): BelongsToMany
    {
        return $this->belongsToMany(Kategori::class, 'kategori_outlet', 'id_outlet', 'id_kategori')
            ->withTimestamps();
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_outlet');
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
