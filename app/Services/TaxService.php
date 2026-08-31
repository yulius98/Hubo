<?php

namespace App\Services;

use App\Models\Produk;

class TaxService
{
    public const MODE_INCLUDE = 'include tax';

    public const MODE_EXCLUDE = 'exclude tax';

    public const MODE_NONE = 'tanpa pajak';

    /**
     * Compute the tax component for a single line item.
     *
     * - include tax: the price already bundles PPN, so its embedded tax is
     *   extracted (gross minus net).
     * - exclude tax: PPN is added on top of the line subtotal.
     * - tanpa pajak: no tax is charged.
     */
    public static function lineTax(
        float $price,
        int $quantity,
        float $ppn,
        string $mode,
    ): float {
        if ($ppn <= 0 || $mode === self::MODE_NONE) {
            return 0;
        }

        $subtotal = $price * $quantity;
        $rate = $ppn / 100;

        return match ($mode) {
            self::MODE_INCLUDE => round($subtotal - ($subtotal / (1 + $rate)), 2),
            self::MODE_EXCLUDE => round($subtotal * $rate, 2),
            default => 0,
        };
    }

    /**
     * Tax for a product (or product variant) line based on its config.
     */
    public static function forProduct(Produk $produk, float $price, int $quantity): float
    {
        return self::lineTax($price, $quantity, (float) $produk->ppn, $produk->tax);
    }

    /**
     * Human-readable tax code label for a product.
     */
    public static function taxCode(Produk $produk): string
    {
        return match ($produk->tax) {
            self::MODE_INCLUDE => 'PPN-DALAM',
            self::MODE_EXCLUDE => 'PPN-LUAR',
            default => 'NON-PPN',
        };
    }
}
