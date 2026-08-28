<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

class CouponService
{
    /**
     * Resolve a coupon by code within the given company scope.
     */
    public function find(string $code, Company $company): ?Coupon
    {
        return Coupon::query()
            ->where('company_id', $company->id)
            ->whereRaw('LOWER(code) = ?', [mb_strtolower(trim($code))])
            ->first();
    }

    /**
     * Validate the coupon and return its discount, throwing a validation
     * error explaining why the coupon cannot be applied.
     */
    public function discountFor(string $code, Company $company, float $subtotal, ?int $outletId = null): float
    {
        $coupon = $this->find($code, $company);

        if ($coupon === null) {
            throw ValidationException::withMessages([
                'coupon_code' => 'Kode kupon tidak ditemukan.',
            ]);
        }

        if (! $coupon->isValid($subtotal, $outletId)) {
            $reason = $this->invalidReason($coupon, $subtotal, $outletId);

            throw ValidationException::withMessages([
                'coupon_code' => $reason,
            ]);
        }

        return $coupon->discountFor($subtotal);
    }

    /**
     * Record usage of the coupon (one use per successful order).
     */
    public function recordUsage(Coupon $coupon): void
    {
        $coupon->increment('used_count');
    }

    private function invalidReason(Coupon $coupon, float $subtotal, ?int $outletId): string
    {
        if (! $coupon->is_active) {
            return 'Kupon sedang nonaktif.';
        }

        if ($coupon->outlet_id !== null && $coupon->outlet_id !== $outletId) {
            return 'Kupon hanya berlaku untuk outlet tertentu.';
        }

        if ($coupon->valid_from !== null && now()->lt($coupon->valid_from)) {
            return 'Kupon belum berlaku.';
        }

        if ($coupon->valid_to !== null && now()->gt($coupon->valid_to)) {
            return 'Kupon sudah kedaluwarsa.';
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            return 'Kupon sudah mencapai batas pemakaian.';
        }

        return 'Total belanja belum memenuhi syarat minimum kupon.';
    }
}
