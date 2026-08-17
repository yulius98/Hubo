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
        $lastPayment = static::where('payment_number', 'like', "PAY-{$date}-%")
            ->orderByDesc('payment_number')
            ->value('payment_number');

        if ($lastPayment) {
            $sequence = (int) substr($lastPayment, -4) + 1;
        } else {
            $sequence = 1;
        }

        return sprintf('PAY-%s-%04d', $date, $sequence);
    }
}
