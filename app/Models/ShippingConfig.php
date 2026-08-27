<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingConfig extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'api_key',
        'origin_city_id',
        'origin_province',
    ];

    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
        ];
    }

    public static function getApiKey(): ?string
    {
        $config = static::first();

        return $config?->api_key;
    }

    public static function getOriginCityId(): ?string
    {
        $config = static::first();

        return $config?->origin_city_id;
    }

    public static function isConfigured(): bool
    {
        $config = static::first();

        return filled($config?->api_key);
    }
}
