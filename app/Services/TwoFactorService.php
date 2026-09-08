<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Native RFC 6238 TOTP (time-based one-time passwords) with recovery codes.
 *
 * No third-party dependency is required: codes are generated and verified with
 * the standard hash_hmac('sha1') construction and constant-time comparison.
 */
class TwoFactorService
{
    public const TOTP_INTERVAL = 30;

    public const TOTP_DIGITS = 6;

    public const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a fresh random base32-encoded secret.
     */
    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(20));
    }

    /**
     * The otpauth:// URI a user can scan with an authenticator app.
     */
    public function otpauthUrl(User $user, string $secret, string $issuer = 'Hubo'): string
    {
        $account = rawurlencode($user->email);

        return 'otpauth://totp/'.$issuer.':'.$account
            .'?secret='.$secret
            .'&issuer='.rawurlencode($issuer)
            .'&digits='.self::TOTP_DIGITS
            .'&period='.self::TOTP_INTERVAL;
    }

    /**
     * Whether the given code is a valid TOTP for the secret at the current
     * time, allowing a one-step drift window on both sides.
     */
    public function valid(string $secret, string $code): bool
    {
        if (! preg_match('/^\d{'.self::TOTP_DIGITS.'}$/', $code)) {
            return false;
        }

        $counter = intdiv(Carbon::now()->timestamp, self::TOTP_INTERVAL);

        for ($offset = -1; $offset <= 1; $offset++) {
            if (hash_equals($this->codeAt($secret, $counter + $offset), $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Whether the user has completed two-factor setup.
     */
    public function isEnabled(User $user): bool
    {
        return $user->two_factor_enabled_at !== null;
    }

    /**
     * The TOTP code an authenticator app would currently display for the
     * given secret. Mirrors a real device during tests.
     */
    public function codeFor(string $secret): string
    {
        $counter = intdiv(Carbon::now()->timestamp, self::TOTP_INTERVAL);

        return $this->codeAt($secret, $counter);
    }

    /**
     * Whether the user's tenant policy requires two-factor authentication.
     */
    public function requiresTwoFactor(User $user): bool
    {
        if (! $user->hasRole('owner outlet') && ! $user->hasRole('admin outlet')) {
            return false;
        }

        $companyId = $user->company_id;

        if ($companyId === null) {
            return false;
        }

        return CompanySetting::get($companyId, CompanySetting::KEY_TWO_FA_REQUIRED) === '1';
    }

    /**
     * Begin the setup flow: provision a secret so the user can enroll it in an
     * authenticator app. The feature is not active until confirmed.
     */
    public function beginEnable(User $user): string
    {
        $secret = $this->generateSecret();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => null,
            'two_factor_enabled_at' => null,
        ])->save();

        return $secret;
    }

    /**
     * Confirm the pending secret with a valid code. On success, recovery codes
     * are minted, hashed and stored, and the feature becomes active.
     *
     * @return array<int, string>|null The plain-text recovery codes, or null
     *                                 when the code is invalid.
     */
    public function confirm(User $user, string $code): ?array
    {
        $secret = $user->two_factor_secret;

        if ($secret === null || ! $this->valid($secret, $code)) {
            return null;
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => json_encode(
                array_map(fn (string $code) => Hash::make($code), $recoveryCodes)
            ),
            'two_factor_enabled_at' => Carbon::now(),
        ])->save();

        return $recoveryCodes;
    }

    /**
     * Disable two-factor using either a TOTP code or a recovery code.
     */
    public function disable(User $user, string $code): bool
    {
        $verified = $this->verify($user, $code) || $this->consumeRecoveryCode($user, $code);

        if (! $verified) {
            return false;
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_enabled_at' => null,
        ])->save();

        return true;
    }

    /**
     * Verify a TOTP code against the user's stored secret.
     */
    public function verify(User $user, string $code): bool
    {
        $secret = $user->two_factor_secret;

        return $secret !== null && $this->valid($secret, $code);
    }

    /**
     * @return array<int, string>
     */
    public function generateRecoveryCodes(int $count = 10): array
    {
        $codes = [];

        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(implode('-', [Str::random(6), Str::random(6)]));
        }

        return $codes;
    }

    /**
     * Validate a recovery code and invalidate it when it matches.
     */
    private function consumeRecoveryCode(User $user, string $input): bool
    {
        $code = strtoupper(trim($input));
        $stored = json_decode((string) $user->two_factor_recovery_codes, true) ?: [];

        foreach ($stored as $index => $hashed) {
            if (! Hash::check($code, $hashed)) {
                continue;
            }

            $remaining = $stored;
            array_splice($remaining, $index, 1);

            $user->forceFill([
                'two_factor_recovery_codes' => json_encode($remaining),
            ])->save();

            return true;
        }

        return false;
    }

    /**
     * The 6-digit TOTP for a given counter value.
     *
     * @see https://datatracker.ietf.org/doc/html/rfc6238
     */
    private function codeAt(string $secret, int $counter): string
    {
        $hash = hash_hmac('sha1', $this->packCounter($counter), $this->base32Decode($secret), true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF;

        return str_pad((string) ($value % (10 ** self::TOTP_DIGITS)), self::TOTP_DIGITS, '0', STR_PAD_LEFT);
    }

    private function packCounter(int $counter): string
    {
        return pack('N2', intdiv($counter, 4_294_967_296), $counter);
    }

    private function base32Encode(string $data): string
    {
        $output = '';

        for ($i = 0, $length = strlen($data); $i < $length; $i += 5) {
            $chunk = substr($data, $i, 5);
            $bits = '';

            foreach (str_split($chunk) as $byte) {
                $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
            }

            for ($offset = 0, $count = strlen($bits); $offset + 5 <= $count; $offset += 5) {
                $output .= self::BASE32_ALPHABET[bindec(substr($bits, $offset, 5))];
            }
        }

        return $output;
    }

    private function base32Decode(string $base32): string
    {
        $base32 = strtoupper(rtrim(trim($base32), '='));
        $data = '';

        for ($i = 0, $length = strlen($base32); $i < $length; $i += 8) {
            $chunk = substr($base32, $i, 8);
            $bits = '';

            foreach (str_split($chunk) as $char) {
                $value = strpos(self::BASE32_ALPHABET, $char);

                if ($value === false) {
                    continue;
                }

                $bits .= str_pad(decbin($value), 5, '0', STR_PAD_LEFT);
            }

            for ($offset = 0, $count = strlen($bits); $offset + 8 <= $count; $offset += 8) {
                $data .= chr(bindec(substr($bits, $offset, 8)));
            }
        }

        return $data;
    }
}
