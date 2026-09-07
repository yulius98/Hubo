<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySetting extends Model
{
    use HasFactory;

    public const KEY_LOGO = 'logo';

    public const KEY_ADDRESS = 'alamat_bisnis';

    public const KEY_TAX_PERCENT = 'konfigurasi_pajak.ppn';

    public const KEY_DEFAULT_SHIPPING_CITY = 'ongkir.kota_default';

    protected $fillable = [
        'company_id',
        'key',
        'value',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Read a setting value for the company, falling back to $default.
     */
    public static function get(int $companyId, string $key, mixed $default = null): mixed
    {
        $row = static::query()
            ->where('company_id', $companyId)
            ->where('key', $key)
            ->first();

        return $row?->value ?? $default;
    }

    /**
     * Set a setting value for the company, creating or replacing the row.
     */
    public static function set(int $companyId, string $key, string|int|float|null $value): void
    {
        static::query()->updateOrCreate(
            ['company_id' => $companyId, 'key' => $key],
            ['value' => $value]
        );
    }

    /**
     * All settings for a company mapped by key.
     *
     * @return array<string, string|null>
     */
    public static function map(int $companyId): array
    {
        return static::query()
            ->where('company_id', $companyId)
            ->pluck('value', 'key')
            ->all();
    }
}
