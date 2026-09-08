<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ConfirmTwoFactorRequest;
use App\Http\Requests\Settings\DisableTwoFactorRequest;
use App\Http\Requests\Settings\UpdateTwoFactorPolicyRequest;
use App\Models\CompanySetting;
use App\Services\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Optional two-factor authentication (TOTP) for owners/admins, plus the
 * tenant-level enforcement policy ("2FA wajib untuk owner").
 *
 * Setup is a two-step flow: the user's secret is provisioned first so it can
 * be added to an authenticator app, then verified with a live code. Recovery
 * codes are shown exactly once, right after the first successful validation.
 */
class SecurityController extends Controller
{
    public function __construct(protected TwoFactorService $twoFactor) {}

    public function index(): Response
    {
        $user = auth()->user();

        $enabled = $this->twoFactor->isEnabled($user);
        $pendingSecret = $enabled ? null : $user->two_factor_secret;

        return Inertia::render('settings/security', [
            'enabled' => $enabled,
            'pending_secret' => $pendingSecret,
            'otpauth_url' => $pendingSecret !== null ? $this->twoFactor->otpauthUrl($user, $pendingSecret) : null,
            'recovery_codes' => session('two_fa_recovery_codes'),
            'policy_enforced' => $this->twoFactor->requiresTwoFactor($user),
            'can_manage_policy' => $user->hasRole('owner outlet') || $user->isSuperAdmin(),
        ]);
    }

    /**
     * Provision a fresh secret for the authenticated user.
     */
    public function enable(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($this->twoFactor->isEnabled($user)) {
            return back()->with('success', 'Autentikasi dua faktor sudah aktif.');
        }

        $secret = $this->twoFactor->beginEnable($user);

        return redirect()->route('settings.security')
            ->with('success', 'Pindai kode QR atau masukkan kunci rahasia di aplikasi autentikator, lalu masukkan kode untuk mengonfirmasi.');
    }

    /**
     * Verify the first live code and activate two-factor for the user.
     */
    public function confirm(ConfirmTwoFactorRequest $request): RedirectResponse
    {
        $user = $request->user();

        $recoveryCodes = $this->twoFactor->confirm($user, $request->validated('code'));

        if ($recoveryCodes === null) {
            return back()->withErrors(['code' => 'Kode verifikasi salah. Coba lagi.']);
        }

        return redirect()->route('settings.security')->with([
            'success' => 'Autentikasi dua faktor berhasil diaktifkan.',
            'two_fa_recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Disable two-factor with a live code or a recovery code.
     */
    public function disable(DisableTwoFactorRequest $request): RedirectResponse
    {
        $user = $request->user();

        if (! $this->twoFactor->disable($user, $request->validated('code'))) {
            return back()->withErrors(['code' => 'Kode tidak valid.'])->withInput();
        }

        return redirect()->route('settings.security')
            ->with('success', 'Autentikasi dua faktor dimatikan.');
    }

    /**
     * Toggle the tenant policy that requires 2FA for owners and admins.
     */
    public function updatePolicy(UpdateTwoFactorPolicyRequest $request): RedirectResponse
    {
        $user = $request->user();
        $companyId = $user->company_id;

        abort_unless($companyId !== null, 403, 'Tidak ada tenant untuk mengatur kebijakan ini.');

        CompanySetting::set($companyId, CompanySetting::KEY_TWO_FA_REQUIRED, $request->boolean('two_fa_required') ? '1' : '0');

        return back()->with('success', $request->boolean('two_fa_required')
            ? '2FA kini wajib untuk semua pemilik & admin. Mereka akan diminta menyiapkan 2FA saat masuk.'
            : 'Kebijakan 2FA wajib dinonaktifkan.');
    }
}
