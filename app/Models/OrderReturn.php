<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderReturn extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'returns';

    protected $fillable = [
        'company_id',
        'order_id',
        'return_number',
        'reason',
        'status',
        'refund_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'refund_amount' => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    public static function generateReturnNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "RET-{$date}-";

        $last = static::where('return_number', 'like', "{$prefix}%")
            ->orderByDesc('return_number')
            ->value('return_number');

        $sequence = $last ? (int) substr($last, -4) + 1 : 1;
        $returnNumber = sprintf('RET-%s-%04d', $date, $sequence);

        if (static::where('return_number', $returnNumber)->exists()) {
            $sequence++;
            $returnNumber = sprintf('RET-%s-%04d', $date, $sequence);
        }

        return $returnNumber;
    }
}
