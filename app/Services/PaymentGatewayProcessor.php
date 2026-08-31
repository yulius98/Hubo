<?php

namespace App\Services;

use App\Mail\OrderPaidMail;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
            match ($gateway) {
                'xendit' => $this->processXendit($payment, $order, $config),
                'midtrans' => $this->processMidtrans($payment, $order, $config),
                default => null,
            };
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
     * Process payment via Xendit Invoice API.
     */
    private function processXendit(Payment $payment, Order $order, array $config): void
    {
        $secretKey = $config['secret_key'] ?? null;

        if (! $secretKey) {
            throw new \RuntimeException('Xendit secret key tidak dikonfigurasi.');
        }

        $baseUrl = rtrim((string) ($config['base_url'] ?? config('services.xendit.base_url', 'https://api.xendit.co')), '/');

        $webhookUrl = $config['webhook_url'] ?? $this->gateways->defaultWebhookUrl('xendit');

        $response = Http::withBasicAuth($secretKey, '')
            ->post("{$baseUrl}/v2/invoices", [
                'external_id' => $payment->payment_number,
                'amount' => (float) $payment->amount,
                'description' => "Order {$order->order_number}",
                'invoice_duration' => 86400,
                'customer' => [
                    'given_names' => $order->user->name,
                    'email' => $order->user->email,
                ],
                'success_redirect_url' => url("/orders/{$order->id}"),
                'failure_redirect_url' => url("/orders/{$order->id}"),
                'payment_methods' => $this->getXenditPaymentMethods($order->payment_method),
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
     */
    private function processMidtrans(Payment $payment, Order $order, array $config): void
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
                    'first_name' => $order->user->name,
                    'email' => $order->user->email,
                ],
                'callbacks' => [
                    'finish' => url("/orders/{$order->id}"),
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
            'PAID' => $this->markPaid($payment, $payload),
            'EXPIRED' => $this->markExpired($payment),
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

        $statusCode = $payload['status_code'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;

        if ($statusCode === '200' && $fraudStatus === 'accept') {
            $this->markPaid($payment, $payload);
        } elseif (in_array($statusCode, ['400', '406', '407', '408', '409'], true)) {
            $this->markExpired($payment);
        }
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
            Mail::to($payment->order->user->email)
                ->send(new OrderPaidMail($payment->order));
        } catch (\Exception $e) {
            Log::error("Failed to send order paid email: {$e->getMessage()}");
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
