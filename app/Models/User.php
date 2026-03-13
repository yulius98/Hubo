<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Role;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'email_verified_at',
        'id_role',
        'avatar',
        'workos_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'workos_id',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function kategori(): HasMany
    {
        return $this->hasMany(Kategori::class , 'id_user');
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class , 'id_user');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class , 'id_user');
    }

    public function keranjangbelanjauser(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaUser::class , 'id_user');
    }

    public function keranjangbelanjakasir(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaKasir::class , 'id_user');
    }

    public function outlets()
    {
        return $this->belongsToMany(Outlet::class,'outlet_user')
            ->withPivot('role_id')
            ->withTimestamps();
    }

    public function role()
    {
        return $this->belongsToMany(Role::class)
            ->withTimestamps();
    }

    protected static function booted()
    {
        static::created(function ($user) {

            static $defaultRoleId = null;

            if (!$defaultRoleId) {
                $defaultRoleId = Role::where('role', 'user')->value('id');
            }

            if ($defaultRoleId) {
                $user->role()->syncWithoutDetaching([$defaultRoleId]);
            }

        });
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'id_staff');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'id_owner');
    }


}
