<?php

namespace App\Http\Controllers;

use App\Models\PaymentGatewayConfig;
use App\Services\PaymentGatewayProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BillingWebhookController extends Controller
{
    public function __construct(
        protected PaymentGatewayProcessor $processor,
    ) {}

    /**
     * Handle a Xendit webhook for subscription invoice payments.
     */
    public function xendit(Request $request): JsonResponse
    {
        $token = $request->header('x-callback-token');

        $config = config('services.xendit.webhook_token', '');
        $storedToken = $config ?: ($this->getConfigValue('xendit', 'webhook_token') ?? '');

        if (! $storedToken || ! hash_equals($storedToken, (string) $token)) {
            Log::warning('Billing webhook: gagal verifikasi token Xendit.');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $this->dispatch($request, 'xendit');
    }

    /**
     * Handle a Midtrans webhook for subscription invoice payments.
     */
    public function midtrans(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->verifyMidtransSignature($payload)) {
            Log::warning('Billing webhook: gagal verifikasi signature Midtrans.');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $this->dispatch($request, 'midtrans');
    }

    /**
     * Delegate the verified payload to the payment processor.
     */
    private function dispatch(Request $request, string $gateway): JsonResponse
    {
        try {
            $this->processor->handleWebhook($gateway, $request->all());
        } catch (\Exception $e) {
            Log::error("Billing webhook error ({$gateway}): {$e->getMessage()}", [
                'exception' => $e,
            ]);

            return response()->json(['message' => 'Internal error'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Verify the Midtrans webhook signature (fail-closed).
     *
     * @param  array<string, mixed>  $payload
     */
    private function verifyMidtransSignature(array $payload): bool
    {
        $signatureKey = $payload['signature_key'] ?? null;

        if (! $signatureKey) {
            return false;
        }

        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';

        $serverKey = $this->getConfigValue('midtrans', 'server_key')
            ?? config('services.midtrans.server_key', '');

        if (! $serverKey) {
            Log::warning('Billing webhook: server key Midtrans tidak dikonfigurasi.');

            return false;
        }

        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        return hash_equals($expectedSignature, $signatureKey);
    }

    /**
     * Get a config value from the payment gateway settings.
     */
    private function getConfigValue(string $gateway, string $key): ?string
    {
        $config = PaymentGatewayConfig::where('gateway', $gateway)->value('config');

        return $config[$key] ?? null;
    }
}
