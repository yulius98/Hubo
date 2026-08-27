<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'outlet_id',
        'supplier_id',
        'po_number',
        'status',
        'expected_date',
        'received_date',
        'total',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'expected_date' => 'date',
            'received_date' => 'date',
            'total' => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(POItem::class);
    }

    public static function generatePoNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "PO-{$date}-";

        $last = static::where('po_number', 'like', "{$prefix}%")
            ->orderByDesc('po_number')
            ->value('po_number');

        $sequence = $last ? (int) substr($last, -4) + 1 : 1;
        $poNumber = sprintf('PO-%s-%04d', $date, $sequence);

        if (static::where('po_number', $poNumber)->exists()) {
            $sequence++;
            $poNumber = sprintf('PO-%s-%04d', $date, $sequence);
        }

        return $poNumber;
    }
}
