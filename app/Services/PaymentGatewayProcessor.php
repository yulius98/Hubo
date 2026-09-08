<?php

namespace App\Services;

use App\Jobs\SendMail;
use App\Mail\OrderPaidMail;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SubscriptionInvoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentGatewayProcessor
{
    public function __construct(
        protected PaymentGatewayService $gateways,
    ) {}

    /**
     * Create a payment record and initiate payment via the active gateway.
     */
    public function createPayment(Order $order): Payment
    {
        $gateway = $this->gateways->activeGateway();

        if (! $gateway) {
            throw new \RuntimeException('Tidak ada payment gateway yang aktif.');
        }

        $config = $this->gateways->config($gateway);

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_number' => Payment::generatePaymentNumber(),
            'gateway' => $gateway,
            'payment_method' => $order->payment_method,
            'amount' => $order->total,
            'status' => 'pending',
        ]);

        try {
            $context = [
                'customer_name' => $order->user->name,
                'customer_email' => $order->user->email,
                'description' => "Order {$order->order_number}",
                'redirect_url' => url("/orders/{$order->id}"),
                'webhook_url' => $this->gateways->defaultWebhookUrl($gateway, false),
                'payment_methods' => $this->getXenditPaymentMethods($order->payment_method),
            ];

            $this->processGateway($payment, $gateway, $config, $context);
        } catch (\Exception $e) {
            Log::error("Payment gateway error for order {$order->order_number}: {$e->getMessage()}");

            $payment->update([
                'status' => 'failed',
                'gateway_response' => ['error' => $e->getMessage()],
            ]);
        }

        return $payment->fresh();
    }

    /**
     * Create a payment for a subscription invoice via the active gateway.
     */
    public function createSubscriptionPayment(SubscriptionInvoice $invoice): Payment
    {
        $gateway = $this->gateways->activeGateway();

        if (! $gateway) {
            throw new \RuntimeException('Tidak ada payment gateway yang aktif.');
        }

        $config = $this->gateways->config($gateway);

        $payment = Payment::create([
            'subscription_invoice_id' => $invoice->id,
            'payment_number' => Payment::generatePaymentNumber(),
            'gateway' => $gateway,
            'payment_method' => 'subscription',
            'amount' => $invoice->amount,
            'status' => 'pending',
        ]);

        try {
            $company = $invoice->subscription?->company;
            $billingUser = $company?->users()->orderBy('users.id')->first();

            $context = [
                'customer_name' => $billingUser?->name ?? $company?->name ?? 'Langganan Hubo',
                'customer_email' => $billingUser?->email,
                'description' => "Invoice langganan {$invoice->invoice_number}",
                'redirect_url' => url('/billing'),
                'webhook_url' => $this->gateways->defaultWebhookUrl($gateway, true),
                'payment_methods' => [],
            ];

            $this->processGateway($payment, $gateway, $config, $context);
        } catch (\Exception $e) {
            Log::error("Payment gateway error for invoice {$invoice->invoice_number}: {$e->getMessage()}");

            $payment->update([
                'status' => 'failed',
                'gateway_response' => ['error' => $e->getMessage()],
            ]);
        }

        return $payment->fresh();
    }

    /**
     * Dispatch a payment record to the matching gateway implementation.
     *
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $context
     */
    private function processGateway(Payment $payment, string $gateway, array $config, array $context): void
    {
        match ($gateway) {
            'xendit' => $this->processXendit($payment, $config, $context),
            'midtrans' => $this->processMidtrans($payment, $config, $context),
            default => null,
        };
    }

    /**
     * Process payment via Xendit Invoice API.
     *
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $context
     */
    private function processXendit(Payment $payment, array $config, array $context): void
    {
        $secretKey = $config['secret_key'] ?? null;

        if (! $secretKey) {
            throw new \RuntimeException('Xendit secret key tidak dikonfigurasi.');
        }

        $baseUrl = rtrim((string) ($config['base_url'] ?? config('services.xendit.base_url', 'https://api.xendit.co')), '/');

        $webhookUrl = $context['webhook_url']
            ?? ($config['webhook_url'] ?? $this->gateways->defaultWebhookUrl('xendit', false));

        $response = Http::withBasicAuth($secretKey, '')
            ->post("{$baseUrl}/v2/invoices", [
                'external_id' => $payment->payment_number,
                'amount' => (float) $payment->amount,
                'description' => $context['description'] ?? 'Pembayaran Hubo',
                'invoice_duration' => 86400,
                'customer' => [
                    'given_names' => $context['customer_name'] ?? 'Pelanggan',
                    'email' => $context['customer_email'] ?? '',
                ],
                'success_redirect_url' => $context['redirect_url'] ?? url('/'),
                'failure_redirect_url' => $context['redirect_url'] ?? url('/'),
                'payment_methods' => $context['payment_methods'] ?? [],
                'callback_url' => $webhookUrl,
            ]);

        if ($response->successful()) {
            $data = $response->json();

            $payment->update([
                'gateway_ref' => $data['id'] ?? null,
                'payment_method' => $data['payment_method'] ?? $payment->payment_method,
                'gateway_response' => $data,
                'status' => 'processing',
            ]);
        } else {
            throw new \RuntimeException(
                'Xendit API error: '.($response->json('message') ?? 'Unknown error')
            );
        }
    }

    /**
     * Process payment via Midtrans Snap API.
     *
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $context
     */
    private function processMidtrans(Payment $payment, array $config, array $context): void
    {
        $serverKey = $config['server_key'] ?? null;

        if (! $serverKey) {
            throw new \RuntimeException('Midtrans server key tidak dikonfigurasi.');
        }

        $mode = $config['mode'] ?? 'sandbox';
        $baseUrl = $mode === 'production'
            ? (string) config('services.midtrans.production_base_url', 'https://app.midtrans.com/api/v2')
            : (string) config('services.midtrans.sandbox_base_url', 'https://app.sandbox.midtrans.com/api/v2');

        $response = Http::withBasicAuth($serverKey, '')
            ->post("{$baseUrl}/payment-links", [
                'transaction_details' => [
                    'order_id' => $payment->payment_number,
                    'gross_amount' => (float) $payment->amount,
                ],
                'customer_details' => [
                    'first_name' => $context['customer_name'] ?? 'Pelanggan',
                    'email' => $context['customer_email'] ?? '',
                ],
                'callbacks' => [
                    'finish' => $context['redirect_url'] ?? url('/'),
                ],
                'expiry' => [
                    'unit' => 'day',
                    'duration' => 1,
                ],
            ]);

        if ($response->successful()) {
            $data = $response->json();

            $payment->update([
                'gateway_ref' => $data['id'] ?? null,
                'payment_method' => $data['payment_method'] ?? $payment->payment_method,
                'gateway_response' => $data,
                'status' => 'processing',
            ]);
        } else {
            throw new \RuntimeException(
                'Midtrans API error: '.($response->json('message') ?? 'Unknown error')
            );
        }
    }

    /**
     * Handle incoming webhook from a payment gateway.
     */
    public function handleWebhook(string $gateway, array $payload): void
    {
        match ($gateway) {
            'xendit' => $this->handleXenditWebhook($payload),
            'midtrans' => $this->handleMidtransWebhook($payload),
            default => null,
        };
    }

    /**
     * Handle Xendit webhook (invoice.paid, invoice.expired).
     */
    private function handleXenditWebhook(array $payload): void
    {
        $externalId = $payload['external_id'] ?? null;

        if (! $externalId) {
            return;
        }

        $payment = Payment::where('payment_number', $externalId)->first();

        if (! $payment) {
            return;
        }

        $status = $payload['status'] ?? null;

        match ($status) {
            'PAID' => $this->markPaidOrSettle($payment, $payload),
            'EXPIRED' => $this->markExpiredOrSettle($payment),
            default => null,
        };
    }

    /**
     * Handle Midtrans webhook (notification).
     */
    private function handleMidtransWebhook(array $payload): void
    {
        $orderId = $payload['order_id'] ?? null;

        if (! $orderId) {
            return;
        }

        $payment = Payment::where('payment_number', $orderId)->first();

        if (! $payment) {
            return;
        }

        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;
        $statusCode = $payload['status_code'] ?? null;

        // Settle on capture (fraud approved) or settlement; anything still in
        // fraud review / pending must not mark the payment as paid.
        $settled = match ($transactionStatus) {
            'settlement' => true,
            'capture' => $fraudStatus !== 'challenge',
            default => false,
        };

        if ($settled) {
            $this->markPaidOrSettle($payment, $payload);

            return;
        }

        $failed = match ($transactionStatus) {
            'deny', 'expire', 'cancel' => true,
            default => in_array($statusCode, ['400', '406', '407', '408', '409'], true),
        };

        if ($failed) {
            $this->markExpiredOrSettle($payment);
        }
    }

    /**
     * Mark a payment as paid. When the payment belongs to a subscription
     * invoice, settle the invoice instead of an order.
     */
    private function markPaidOrSettle(Payment $payment, array $response): void
    {
        if (! $this->webhookAmountMatches($payment, $response)) {
            Log::warning("Payment {$payment->payment_number} amount mismatch in webhook notification, refusing to settle.");

            return;
        }

        if ($payment->subscription_invoice_id !== null) {
            $this->settleSubscriptionPayment($payment, $response);

            return;
        }

        $this->markPaid($payment, $response);
    }

    /**
     * Whether the webhook-reported amount matches the recorded payment,
     * protecting against mismatched/forged notifications.
     *
     * @param  array<string, mixed>  $response
     */
    private function webhookAmountMatches(Payment $payment, array $response): bool
    {
        $amount = $response['amount'] ?? $response['gross_amount'] ?? null;

        if ($amount === null) {
            return false;
        }

        return abs((float) $amount - (float) $payment->amount) < 0.01;
    }

    /**
     * Mark a payment as expired. Subscription payments are marked expired
     * without touching an order.
     */
    private function markExpiredOrSettle(Payment $payment): void
    {
        if ($payment->subscription_invoice_id !== null) {
            $this->markExpiredOnly($payment);

            return;
        }

        $this->markExpired($payment);
    }

    /**
     * Settle a subscription invoice payment: record the payment and mark the
     * invoice as paid via the billing service.
     */
    private function settleSubscriptionPayment(Payment $payment, array $response): void
    {
        if ($payment->status === 'success') {
            Log::info("Payment {$payment->payment_number} already marked as paid, skipping.");

            return;
        }

        $payment->update([
            'status' => 'success',
            'gateway_response' => array_merge(
                $payment->gateway_response ?? [],
                $response
            ),
            'paid_at' => now(),
        ]);

        try {
            $invoice = $payment->subscriptionInvoice?->fresh();

            if ($invoice !== null) {
                app(SubscriptionBillingService::class)->payInvoice($invoice);
            }
        } catch (\Exception $e) {
            Log::error("Failed to settle subscription invoice payment {$payment->payment_number}: {$e->getMessage()}");
        }
    }

    /**
     * Mark a payment as expired without touching the related order.
     */
    private function markExpiredOnly(Payment $payment): void
    {
        if ($payment->status === 'expired' || $payment->status === 'success') {
            Log::info("Payment {$payment->payment_number} already in terminal state ({$payment->status}), skipping.");

            return;
        }

        $payment->update(['status' => 'expired']);
    }

    /**
     * Mark a payment as paid and update the order.
     */
    private function markPaid(Payment $payment, array $response): void
    {
        if ($payment->status === 'success') {
            Log::info("Payment {$payment->payment_number} already marked as paid, skipping.");

            return;
        }

        $payment->update([
            'status' => 'success',
            'gateway_response' => array_merge(
                $payment->gateway_response ?? [],
                $response
            ),
            'paid_at' => now(),
        ]);

        $orderService = app(OrderService::class);
        $orderService->transitionStatus($payment->order, 'paid');

        try {
            $payment->order->loadMissing('items');
            SendMail::dispatch(new OrderPaidMail($payment->order), $payment->order->user->email);
        } catch (\Exception $e) {
            Log::error("Failed to queue order paid email: {$e->getMessage()}");
        }
    }

    /**
     * Mark a payment as expired.
     */
    private function markExpired(Payment $payment): void
    {
        if ($payment->status === 'expired' || $payment->status === 'success') {
            Log::info("Payment {$payment->payment_number} already in terminal state ({$payment->status}), skipping.");

            return;
        }

        $payment->update(['status' => 'expired']);

        $orderService = app(OrderService::class);
        $orderService->transitionStatus($payment->order, 'expired');
    }

    /**
     * Get the payment URL from a gateway response.
     */
    public function getPaymentUrl(Payment $payment): ?string
    {
        return match ($payment->gateway) {
            'xendit' => $payment->gateway_response['invoice_url'] ?? null,
            'midtrans' => $payment->gateway_response['payment_url'] ?? null,
            default => null,
        };
    }

    /**
     * Map our payment method to Xendit payment methods.
     *
     * @return list<string>
     */
    private function getXenditPaymentMethods(?string $method): array
    {
        return match ($method) {
            'ewallet' => ['EWALLET', 'QRIS'],
            'va' => ['BNI', 'BRI', 'BCA', 'MANDIRI', 'PERMATA'],
            'card' => ['CREDIT_CARD'],
            default => ['QRIS', 'EWALLET', 'BNI', 'BRI', 'BCA', 'MANDIRI'],
        };
    }
}
