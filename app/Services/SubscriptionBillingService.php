<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Support\Carbon;

class SubscriptionBillingService
{
    /**
     * Move a subscription into its next billing period. The new period is
     * anchored on the previous period boundary (a trial ends at its end date).
     */
    public function advancePeriod(Subscription $subscription): Subscription
    {
        $previousEnd = $subscription->current_period_end ?? $subscription->starts_at ?? Carbon::now();

        $start = Carbon::parse($previousEnd);
        $end = $start->copy()->addMonth();

        $subscription->update([
            'current_period_start' => $start,
            'current_period_end' => $end,
        ]);

        return $subscription->fresh();
    }

    /**
     * Advance to the next billing period and create a pending invoice for it.
     * Free plans skip straight to an active renewal.
     */
    public function createInvoice(Subscription $subscription): ?SubscriptionInvoice
    {
        $plan = $subscription->plan;

        if ($plan === null) {
            return null;
        }

        $this->advancePeriod($subscription);

        $amount = (float) $plan->price_monthly;

        if ($amount <= 0) {
            $subscription->update(['status' => Subscription::STATUS_ACTIVE]);

            return null;
        }

        $invoice = SubscriptionInvoice::create([
            'subscription_id' => $subscription->id,
            'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
            'amount' => $amount,
            'status' => SubscriptionInvoice::STATUS_PENDING,
            'period_start' => $subscription->current_period_start,
            'period_end' => $subscription->current_period_end,
        ]);

        $subscription->update(['status' => Subscription::STATUS_PAST_DUE]);

        return $invoice;
    }

    /**
     * Mark the current period as paid.
     */
    public function markPeriodPaid(Subscription $subscription): Subscription
    {
        $subscription->update(['status' => Subscription::STATUS_ACTIVE]);

        return $subscription->fresh();
    }

    /**
     * Settle a pending invoice once payment is confirmed.
     */
    public function payInvoice(SubscriptionInvoice $invoice): void
    {
        $invoice->markPaid();

        $this->markPeriodPaid($invoice->subscription);
    }

    /**
     * Process every active billing state that is due. Called by the scheduler.
     *
     * @return array{expired: int, invoiced: int, free: int}
     */
    public function processDueBilling(): array
    {
        $counts = ['expired' => 0, 'invoiced' => 0, 'free' => 0];

        Subscription::query()
            ->whereIn('status', [Subscription::STATUS_TRIAL, Subscription::STATUS_ACTIVE, Subscription::STATUS_PAST_DUE])
            ->with('plan', 'company')
            ->chunk(100, function ($subscriptions) use (&$counts): void {
                foreach ($subscriptions as $subscription) {
                    $outcome = $this->settle($subscription);

                    if (is_string($outcome)) {
                        $counts[$outcome]++;
                    }
                }
            });

        return $counts;
    }

    /**
     * Settle a single subscription whose lifecycle is due for progress.
     *
     * @return 'expired'|'invoiced'|'free'|null
     */
    public function settle(Subscription $subscription): ?string
    {
        $status = $subscription->status;
        $now = Carbon::now();

        if ($status === Subscription::STATUS_TRIAL && $subscription->onTrial()) {
            return null;
        }

        if ($status === Subscription::STATUS_TRIAL && $subscription->trialEnded()) {
            $plan = $subscription->plan;

            if ($plan !== null && (float) $plan->price_monthly > 0) {
                $this->createInvoice($subscription);

                return 'invoiced';
            }

            $this->advancePeriod($subscription);
            $this->markPeriodPaid($subscription);

            return 'free';
        }

        if ($status === Subscription::STATUS_PAST_DUE
            && $subscription->current_period_end !== null
            && $now->greaterThan($subscription->current_period_end)) {
            $this->expire($subscription);
            $this->suspendCompany($subscription->company);

            return 'expired';
        }

        if ($status === Subscription::STATUS_ACTIVE
            && $subscription->current_period_end !== null
            && $now->greaterThanOrEqualTo($subscription->current_period_end)) {
            $plan = $subscription->plan;

            if ($plan !== null && (float) $plan->price_monthly > 0) {
                $this->createInvoice($subscription);

                return 'invoiced';
            }

            $this->advancePeriod($subscription);

            return 'free';
        }

        return null;
    }

    /**
     * Mark a subscription as expired.
     */
    public function expire(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => Subscription::STATUS_EXPIRED,
            'ends_at' => now(),
        ]);

        return $subscription;
    }

    /**
     * Suspend the tenant associated with an expired subscription.
     */
    public function suspendCompany(?Company $company): void
    {
        if ($company !== null && $company->isActive()) {
            $company->update(['status' => Company::STATUS_EXPIRED]);
        }
    }
}
