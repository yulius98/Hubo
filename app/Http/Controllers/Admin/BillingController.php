<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionInvoice;
use App\Services\SubscriptionBillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(protected SubscriptionBillingService $billing) {}

    /**
     * Show subscription invoices and usage across all tenants.
     */
    public function index(Request $request): Response
    {
        $period = (string) $request->query('period', now()->format('Y-m'));
        $status = (string) $request->query('status', '');
        $search = (string) $request->query('search', '');

        $invoices = SubscriptionInvoice::query()
            ->with(['subscription.plan:id,name,slug,price_monthly', 'subscription.company:id,name'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query
                ->where('invoice_number', 'like', "%{$search}%")
                ->orWhereHas('subscription.company', fn ($q) => $q->where('name', 'like', "%{$search}%")))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $invoices->getCollection()->transform(fn (SubscriptionInvoice $invoice) => [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'amount' => (float) $invoice->amount,
            'status' => $invoice->status,
            'period_start' => $invoice->period_start,
            'period_end' => $invoice->period_end,
            'paid_at' => $invoice->paid_at,
            'company' => $invoice->subscription?->company?->name ?? '—',
            'plan' => $invoice->subscription?->plan?->name ?? '—',
        ]);

        $metrics = [
            'pending' => (int) SubscriptionInvoice::where('status', SubscriptionInvoice::STATUS_PENDING)->count(),
            'paid' => (int) SubscriptionInvoice::where('status', SubscriptionInvoice::STATUS_PAID)->count(),
            'revenue' => (float) SubscriptionInvoice::where('status', SubscriptionInvoice::STATUS_PAID)->sum('amount'),
        ];

        return Inertia::render('admin/billing', [
            'invoices' => $invoices,
            'metrics' => $metrics,
            'filters' => ['period' => $period, 'status' => $status, 'search' => $search],
        ]);
    }

    /**
     * Manually trigger the due-billing scheduler.
     */
    public function process(): RedirectResponse
    {
        $counts = $this->billing->processDueBilling();

        return redirect()->back()->with('success', sprintf(
            'Pemrosesan tagihan selesai: %d tagihan dibuat, %d perpanjangan gratis, %d berakhir.',
            $counts['invoiced'],
            $counts['free'],
            $counts['expired'],
        ));
    }
}
