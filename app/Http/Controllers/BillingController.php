<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayInvoiceRequest;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Services\PaymentGatewayProcessor;
use App\Services\PaymentGatewayService;
use App\Services\SubscriptionBillingService;
use App\Services\SubscriptionService;
use App\Services\TenantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(
        protected TenantService $tenants,
        protected SubscriptionService $subscriptions,
        protected SubscriptionBillingService $billing,
        protected PaymentGatewayProcessor $paymentProcessor,
        protected PaymentGatewayService $gateways,
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
     * Pay/initiate payment of a pending invoice. When a payment gateway is
     * configured and active, redirect the user to the gateway payment URL;
     * otherwise fall back to the in-app (test) flow.
     */
    public function payInvoice(PayInvoiceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $company = $this->requireCompany();

        if ($company instanceof RedirectResponse) {
            return $company;
        }

        $invoice = SubscriptionInvoice::with('subscription')->findOrFail($validated['invoice_id']);

        if ($invoice->subscription->company_id !== $company->id) {
            abort(403, 'Anda tidak memiliki akses ke invoice ini.');
        }

        if ($invoice->status !== SubscriptionInvoice::STATUS_PENDING) {
            return redirect()->back()->with('error', 'Invoice sudah tidak berstatus pending.');
        }

        $gateway = $this->gateways->activeGateway();

        if ($gateway !== null && $this->gateways->isConfigured($gateway)) {
            try {
                // Reuse an active gateway payment instead of creating a new one
                // on every "Bayar" click.
                $payment = Payment::query()
                    ->where('subscription_invoice_id', $invoice->id)
                    ->whereIn('status', ['pending', 'processing'])
                    ->latest()
                    ->first();

                if ($payment === null || $this->paymentProcessor->getPaymentUrl($payment) === null) {
                    if ($payment !== null) {
                        $payment->update(['status' => 'failed']);
                    }

                    $payment = $this->paymentProcessor->createSubscriptionPayment($invoice->fresh());
                }

                $paymentUrl = $this->paymentProcessor->getPaymentUrl($payment);

                if ($paymentUrl === null) {
                    throw new \RuntimeException('Gateway tidak mengembalikan URL pembayaran.');
                }

                return redirect()->back()->with('payment_url', $paymentUrl);
            } catch (\Exception $e) {
                Log::error("Pembayaran invoice langganan gagal ({$invoice->invoice_number}): {$e->getMessage()}", [
                    'exception' => $e,
                ]);

                return redirect()->back()->with('error', 'Gagal memproses pembayaran. Silakan coba beberapa saat lagi.');
            }
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
