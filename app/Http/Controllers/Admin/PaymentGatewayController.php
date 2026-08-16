<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewayConfig;
use App\Services\PaymentGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentGatewayController extends Controller
{
    public function __construct(protected PaymentGatewayService $gateways) {}

    /**
     * Show the payment gateway settings page.
     */
    public function index(): Response
    {
        $gateways = collect([
            PaymentGatewayConfig::XENDIT,
            PaymentGatewayConfig::MIDTRANS,
        ])->map(fn (string $gateway) => [
            'gateway' => $gateway,
            'configured' => $this->gateways->isConfigured($gateway),
            'configured_fields' => $this->gateways->configuredFields($gateway),
            'config' => $this->publicConfig($gateway),
            'default_webhook_url' => $this->gateways->defaultWebhookUrl($gateway),
        ])->values();

        return Inertia::render('admin/settings', [
            'active_gateway' => $this->gateways->activeGateway(),
            'gateways' => $gateways,
        ]);
    }

    /**
     * Persist the configuration for a gateway and activate it.
     */
    public function update(Request $request): RedirectResponse
    {
        $gateway = (string) $request->input('gateway');

        $existing = $this->gateways->config($gateway);
        $secretFields = $this->gateways->maskedFields($gateway);

        $rules = [
            'gateway' => ['required', 'string', Rule::in([PaymentGatewayConfig::XENDIT, PaymentGatewayConfig::MIDTRANS])],
            'config' => ['required', 'array'],
            'config.mode' => ['required', Rule::in(['sandbox', 'production'])],
            'config.webhook_url' => ['nullable', 'url', 'max:500'],
        ];

        if ($gateway === PaymentGatewayConfig::MIDTRANS) {
            $rules['config.merchant_id'] = ['nullable', 'string', 'max:255'];
        }

        foreach ($secretFields as $field) {
            $rules["config.{$field}"] = filled($existing[$field] ?? null)
                ? ['nullable', 'string', 'max:500']
                : ['required', 'string', 'max:500'];
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        $submitted = $validated['config'];
        $merged = $existing;

        foreach ($submitted as $key => $value) {
            if (in_array($key, $secretFields, true)) {
                if (filled($value)) {
                    $merged[$key] = $value;
                }
            } else {
                $merged[$key] = $value;
            }
        }

        if (blank($merged['webhook_url'] ?? null)) {
            $merged['webhook_url'] = $this->gateways->defaultWebhookUrl($gateway);
        }

        $this->gateways->save($gateway, $merged, activate: true);

        $label = $gateway === PaymentGatewayConfig::XENDIT ? 'Xendit' : 'Midtrans';

        return redirect()->back()
            ->with('success', "Konfigurasi payment gateway {$label} berhasil disimpan dan diaktifkan.");
    }

    /**
     * Return only the non-secret portion of a gateway configuration.
     *
     * @return array<string, mixed>
     */
    private function publicConfig(string $gateway): array
    {
        $config = $this->gateways->config($gateway);
        $masked = $this->gateways->maskedFields($gateway);

        return collect($config)
            ->except($masked)
            ->all();
    }
}
