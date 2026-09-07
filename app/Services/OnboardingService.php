<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Http\Request;

class OnboardingService
{
    public const MAX_STEP = 4;

    public function __construct(protected TenantService $tenants) {}

    /**
     * Whether the user still needs to complete the first-run wizard.
     *
     * A tenant needs onboarding when it exists but has no outlet yet. The
     * wizard never blocks access permanently: once dismissed it stays out of
     * the way until the tenant actually creates an outlet.
     */
    public function needsFor(?Company $company, Request $request): bool
    {
        $user = $request->user();

        if ($user === null || $user->hasRole('super admin')) {
            return false;
        }

        if ($request->session()->get('onboarding.dismissed', false)) {
            return false;
        }

        return $company !== null && $company->outlets()->count() === 0;
    }

    /**
     * The current wizard step (1..4) from the session.
     */
    public function step(Request $request): int
    {
        $step = (int) $request->session()->get('onboarding.step', 1);

        return min(self::MAX_STEP, max(1, $step));
    }

    /**
     * Advance the wizard step, dismissing it on the final step.
     */
    public function advance(Request $request): bool
    {
        $step = $this->step($request);

        if ($step === self::MAX_STEP) {
            $request->session()->forget('onboarding.step');

            return false;
        }

        $request->session()->put('onboarding.step', $step + 1);

        return true;
    }

    /**
     * Mark the wizard as dismissed so it no longer redirects.
     */
    public function dismiss(Request $request): void
    {
        $request->session()->put('onboarding.dismissed', true);
        $request->session()->forget('onboarding.step');
    }

    /**
     * Forget the wizard state once the tenant is set up.
     */
    public function complete(Request $request): void
    {
        $request->session()->forget('onboarding.step');
        $request->session()->forget('onboarding.dismissed');
    }
}
