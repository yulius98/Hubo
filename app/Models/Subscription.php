<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Subscription extends Model
{
    use HasFactory;

    public const STATUS_TRIAL = 'trial';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PAST_DUE = 'past_due';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_EXPIRED = 'expired';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'plan_id',
        'status',
        'starts_at',
        'trial_ends_at',
        'ends_at',
        'canceled_at',
        'current_period_start',
        'current_period_end',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'ends_at' => 'datetime',
            'canceled_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            || $this->status === self::STATUS_TRIAL;
    }

    public function isTrial(): bool
    {
        return $this->status === self::STATUS_TRIAL;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function onTrial(): bool
    {
        return $this->trial_ends_at !== null
            && Carbon::now()->lessThan($this->trial_ends_at);
    }

    public function trialEnded(): bool
    {
        return $this->trial_ends_at !== null
            && Carbon::now()->greaterThanOrEqualTo($this->trial_ends_at);
    }
}
