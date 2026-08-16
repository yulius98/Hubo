<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_monthly',
        'max_outlets',
        'max_products',
        'max_staff',
        'trial_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_monthly' => 'float',
            'max_outlets' => 'integer',
            'max_products' => 'integer',
            'max_staff' => 'integer',
            'trial_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function features(): HasMany
    {
        return $this->hasMany(PlanFeature::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $feature): bool
    {
        return $this->features()
            ->where('feature', $feature)
            ->where(function ($query) {
                $query->where('value', '1')
                    ->orWhere('value', 'true');
            })
            ->exists();
    }

    public function featureKeys(): array
    {
        return $this->features()->pluck('feature')->all();
    }

    public function isUnlimitedOutlets(): bool
    {
        return $this->max_outlets === null;
    }

    public function isUnlimitedProducts(): bool
    {
        return $this->max_products === null;
    }

    public function isUnlimitedStaff(): bool
    {
        return $this->max_staff === null;
    }
}
