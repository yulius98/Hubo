<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'label',
        'nama_penerima',
        'no_hp',
        'provinsi_id',
        'provinsi',
        'kota_id',
        'kota',
        'alamat',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * The user who owns this shipping address.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
