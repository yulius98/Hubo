<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'payment_number',
        'gateway',
        'gateway_ref',
        'payment_method',
        'amount',
        'status',
        'gateway_response',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'gateway_response' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public static function generatePaymentNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "PAY-{$date}-";

        $lastPayment = static::where('payment_number', 'like', "{$prefix}%")
            ->orderByDesc('payment_number')
            ->value('payment_number');

        if ($lastPayment) {
            $sequence = (int) substr($lastPayment, -4) + 1;
        } else {
            $sequence = 1;
        }

        $paymentNumber = sprintf('PAY-%s-%04d', $date, $sequence);

        if (static::where('payment_number', $paymentNumber)->exists()) {
            $sequence++;
            $paymentNumber = sprintf('PAY-%s-%04d', $date, $sequence);
        }

        return $paymentNumber;
    }
}
