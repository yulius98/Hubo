<?php

namespace App\Http\Controllers;

use App\Models\PaymentGatewayConfig;
use App\Services\PaymentGatewayProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected PaymentGatewayProcessor $processor,
    ) {}

    /**
     * Handle webhook from Xendit.
     */
    public function xendit(Request $request): JsonResponse
    {
        $token = $request->header('x-callback-token');

        $config = config('services.xendit.webhook_token', '');
        $storedToken = $config ?: ($this->getConfigValue('xendit', 'webhook_token') ?? '');

        if ($storedToken && $token !== $storedToken) {
            Log::warning('Xendit webhook: invalid token');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $this->processor->handleWebhook('xendit', $request->all());
        } catch (\Exception $e) {
            Log::error("Xendit webhook error: {$e->getMessage()}", [
                'exception' => $e,
            ]);

            return response()->json(['message' => 'Internal error'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle webhook from Midtrans.
     */
    public function midtrans(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->verifyMidtransSignature($payload)) {
            Log::warning('Midtrans webhook: invalid signature');

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $this->processor->handleWebhook('midtrans', $payload);
        } catch (\Exception $e) {
            Log::error("Midtrans webhook error: {$e->getMessage()}", [
                'exception' => $e,
            ]);

            return response()->json(['message' => 'Internal error'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Verify Midtrans webhook signature.
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
            Log::warning('Midtrans webhook: server key not configured, skipping signature verification');

            return true;
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
