<?php

namespace App\Services;

use App\Jobs\SendMail;
use App\Mail\SubscriptionBillingReminderMail;
use App\Mail\SubscriptionInvoicePaidMail;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
        $subscription = $invoice->subscription;

        if ($subscription === null) {
            return;
        }

        $invoice->markPaid();

        // A cancelled subscription must never be resurrected by a late payment.
        if (! $subscription->isCancelled()) {
            $this->markPeriodPaid($subscription);
        }

        // Reinstate a tenant that was suspended because of an unpaid invoice.
        $company = $subscription->company;

        if ($company !== null && $company->status === Company::STATUS_EXPIRED) {
            $company->activate();
        }

        try {
            $invoice->loadMissing('subscription.company');

            $recipient = $invoice->subscription?->company?->users()->orderBy('users.id')->first();

            if ($recipient !== null) {
                SendMail::dispatch(new SubscriptionInvoicePaidMail($invoice->fresh()), $recipient->email);
            }
        } catch (\Exception $e) {
            Log::error("Failed to queue subscription invoice paid email for {$invoice->invoice_number}: {$e->getMessage()}");
        }
    }

    /**
     * Settle a subscription invoice payment confirmed via webhook.
     */
    public function settlePayment(Payment $payment): void
    {
        $invoice = $payment->subscriptionInvoice?->fresh();

        if ($invoice === null) {
            return;
        }

        if ($invoice->status === SubscriptionInvoice::STATUS_PAID) {
            return;
        }

        $this->payInvoice($invoice);
    }

    /**
     * Send reminders for invoices that are about to fall due and mark any
     * invoice that has already passed its due date as overdue, suspending the
     * tenant when that happens.
     *
     * @return array{reminder_sent: int, overdue: int}
     */
    public function processReminders(): array
    {
        $counts = ['reminder_sent' => 0, 'overdue' => 0];
        $now = Carbon::now();

        SubscriptionInvoice::query()
            ->where('status', SubscriptionInvoice::STATUS_PENDING)
            ->whereNotNull('period_end')
            ->with('subscription.company')
            ->chunk(100, function ($invoices) use (&$counts, $now): void {
                foreach ($invoices as $invoice) {
                    $due = Carbon::parse($invoice->period_end);

                    $graceDays = (int) config('billing.grace_days', 0);
                    $hardDue = $due->copy()->addDays($graceDays);

                    if ($now->greaterThan($hardDue)) {
                        $this->markOverdue($invoice);

                        $counts['overdue']++;

                        continue;
                    }

                    $reminderSentAt = $invoice->metadata['reminder_sent_at'] ?? null;
                    $withinGraceMinutes = (int) config('billing.reminder_advance_days', 3) * 1440;

                    if ($reminderSentAt === null && $now->diffInMinutes($due) <= $withinGraceMinutes) {
                        $this->sendReminder($invoice);
                        $counts['reminder_sent']++;
                    }
                }
            });

        return $counts;
    }

    /**
     * Whether a tenant may still run core transactions (new orders).
     */
    public function tenantCanTransact(?Company $company): bool
    {
        if ($company === null) {
            return false;
        }

        return $company->isActive() && ! $company->isSuspended();
    }

    /**
     * Abort order creation when the tenant is overdue/expired so the account
     * cannot keep transacting without an active subscription.
     */
    public function assertTenantCanTransact(?Company $company): void
    {
        if ($this->tenantCanTransact($company)) {
            return;
        }

        throw ValidationException::withMessages([
            'billing' => 'Langganan Anda tidak aktif. Silakan selesaikan pembayaran tagihan di halaman Billing untuk melanjutkan transaksi.',
        ]);
    }

    /**
     * Mark a pending invoice as overdue and suspend the tenant.
     */
    public function markOverdue(SubscriptionInvoice $invoice): void
    {
        $invoice->update(['status' => SubscriptionInvoice::STATUS_OVERDUE]);

        $subscription = $invoice->subscription;

        if ($subscription !== null && in_array($subscription->status, [
            Subscription::STATUS_TRIAL,
            Subscription::STATUS_ACTIVE,
            Subscription::STATUS_PAST_DUE,
        ], true)) {
            $this->expire($subscription);
        }

        $this->suspendCompany($invoice->subscription?->company);
    }

    /**
     * Send a billing reminder email for an invoice (once), tracked in the
     * invoice metadata.
     */
    private function sendReminder(SubscriptionInvoice $invoice): void
    {
        $recipient = $invoice->subscription?->company?->users()->orderBy('users.id')->first();

        if ($recipient === null) {
            return;
        }

        try {
            SendMail::dispatch(new SubscriptionBillingReminderMail($invoice->fresh()), $recipient->email);

            $invoice->update([
                'metadata' => array_merge($invoice->metadata ?? [], [
                    'reminder_sent_at' => Carbon::now()->toDateTimeString(),
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send billing reminder for {$invoice->invoice_number}: {$e->getMessage()}");
        }
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
            && $now->greaterThan($subscription->current_period_end->copy()->addDays((int) config('billing.grace_days', 0)))) {
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
