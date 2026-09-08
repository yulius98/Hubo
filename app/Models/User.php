<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\Contracts\HasApiTokens as HasApiTokensContract;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements HasApiTokensContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'avatar',
        'workos_id',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'workos_id',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
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
            'two_factor_enabled_at' => 'datetime',
        ];
    }

    public function kategori(): HasMany
    {
        return $this->hasMany(Kategori::class, 'id_user');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function produk(): HasMany
    {
        return $this->hasMany(Produk::class, 'id_user');
    }

    public function transaksi(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_user');
    }

    public function keranjangbelanjauser(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaUser::class, 'id_user');
    }

    public function keranjangbelanjakasir(): HasMany
    {
        return $this->hasMany(KeranjangBelanjaKasir::class, 'id_user');
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /**
     * Products saved to the user's wishlist.
     */
    public function wishlist(): BelongsToMany
    {
        return $this->belongsToMany(Produk::class, 'produk_user')
            ->withTimestamps();
    }

    public function outlets()
    {
        return $this->belongsToMany(Outlet::class, 'outlet_user')
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

            if (! $defaultRoleId) {
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

    public function hasRole(string $role): bool
    {
        return $this->role()->where('role', $role)->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super admin');
    }

    public function hasOutletRole(Outlet $outlet, string $role): bool
    {
        return $this->outlets()
            ->wherePivot('outlet_id', $outlet->id)
            ->wherePivotIn('role_id', Role::where('role', $role)->pluck('id'))
            ->exists();
    }
}
