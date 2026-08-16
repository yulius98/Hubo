<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_TRIAL = 'trial';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_EXPIRED = 'expired';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'status',
        'trial_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Company $company) {
            if (empty($company->slug)) {
                $company->slug = Str::slug($company->name).'-'.Str::lower(Str::random(5));
            }
        });
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->latestOfMany();
    }

    public function plan(): ?Plan
    {
        return $this->subscription?->plan;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            || $this->status === self::STATUS_TRIAL;
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }

    public function suspend(): static
    {
        $this->update(['status' => self::STATUS_SUSPENDED]);

        return $this;
    }

    public function activate(): static
    {
        $this->update(['status' => self::STATUS_ACTIVE]);

        return $this;
    }
}
