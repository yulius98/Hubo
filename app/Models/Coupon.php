<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_PERCENTAGE = 'percentage';

    public const TYPE_FIXED = 'fixed';

    protected $fillable = [
        'company_id',
        'outlet_id',
        'code',
        'name',
        'type',
        'value',
        'min_purchase',
        'max_discount',
        'valid_from',
        'valid_to',
        'usage_limit',
        'used_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
            'value' => 'decimal:2',
            'min_purchase' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'valid_from' => 'datetime',
            'valid_to' => 'datetime',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'coupon_id');
    }

    /**
     * Whether the coupon is currently valid (active, within date range and quota).
     */
    public function isValid(float $subtotal, ?int $outletId = null): bool
    {
        if (! $this->is_active || $this->trashed()) {
            return false;
        }

        if ($this->outlet_id !== null && $this->outlet_id !== $outletId) {
            return false;
        }

        if ($this->valid_from !== null && now()->lt($this->valid_from)) {
            return false;
        }

        if ($this->valid_to !== null && now()->gt($this->valid_to)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return $this->min_purchase <= 0 || $subtotal >= (float) $this->min_purchase;
    }

    /**
     * Calculate the discount amount for a given subtotal.
     */
    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === self::TYPE_PERCENTAGE
            ? $subtotal * ((float) $this->value / 100)
            : (float) $this->value;

        if ($this->max_discount !== null && $discount > (float) $this->max_discount) {
            $discount = (float) $this->max_discount;
        }

        if ($discount > $subtotal) {
            $discount = $subtotal;
        }

        return round($discount, 2);
    }
}
