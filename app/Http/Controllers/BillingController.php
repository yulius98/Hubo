<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Services\SubscriptionBillingService;
use App\Services\SubscriptionService;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(
        protected TenantService $tenants,
        protected SubscriptionService $subscriptions,
        protected SubscriptionBillingService $billing,
    ) {}

    /**
     * Show the tenant's billing information and invoice history.
     */
    public function index(): Response|RedirectResponse
    {
        $company = $this->requireCompany();

        if ($company instanceof RedirectResponse) {
            return $company;
        }

        $subscription = $company->subscriptions()
            ->whereIn('status', [Subscription::STATUS_TRIAL, Subscription::STATUS_ACTIVE, Subscription::STATUS_PAST_DUE, Subscription::STATUS_CANCELLED])
            ->with(['plan:id,name,slug,price_monthly'])
            ->latest()
            ->first();

        $invoices = $subscription
            ? $subscription->invoices()
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn (SubscriptionInvoice $invoice) => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'amount' => (float) $invoice->amount,
                    'status' => $invoice->status,
                    'period_start' => $invoice->period_start,
                    'period_end' => $invoice->period_end,
                    'paid_at' => $invoice->paid_at,
                ])
                ->values()
            : collect();

        return Inertia::render('akun_users/billing', [
            'tenant' => $company->only('id', 'name'),
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'plan' => $subscription->plan?->name ?? '—',
                'plan_price' => $subscription->plan?->price_monthly ?? 0,
                'trial_ends_at' => $subscription->trial_ends_at,
                'current_period_end' => $subscription->current_period_end,
                'ends_at' => $subscription->ends_at,
            ] : null,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Simulate payment of a pending invoice so the billing flow can be
     * completed in-app without a gateway (Phase 5 stand-in).
     */
    public function payInvoice(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:subscription_invoices,id',
        ]);

        $company = $this->requireCompany();

        if ($company instanceof RedirectResponse) {
            return $company;
        }

        $invoice = SubscriptionInvoice::with('subscription')->findOrFail($validated['invoice_id']);

        if ($invoice->subscription->company_id !== $company->id) {
            abort(403, 'Anda tidak memiliki akses ke invoice ini.');
        }

        $this->billing->payInvoice($invoice->fresh());

        return redirect()->back()->with('success', "Tagihan {$invoice->invoice_number} telah dibayar.");
    }

    /**
     * Resolve the company of the authenticated user.
     */
    private function requireCompany(): Company|RedirectResponse
    {
        $company = $this->tenants->resolveForUser(Auth::user());

        if ($company === null) {
            return redirect()->route('dashboard')->with('error', 'Anda belum memiliki tenant/company aktif.');
        }

        return $company;
    }
}
