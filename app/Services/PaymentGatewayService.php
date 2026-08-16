<?php

namespace App\Services;

use App\Models\PaymentGatewayConfig;

class PaymentGatewayService
{
    public const XENDIT = PaymentGatewayConfig::XENDIT;

    public const MIDTRANS = PaymentGatewayConfig::MIDTRANS;

    /**
     * The currently active payment gateway, or null when none is set.
     */
    public function activeGateway(): ?string
    {
        return PaymentGatewayConfig::where('is_active', true)->value('gateway');
    }

    /**
     * Whether the given gateway is the active one.
     */
    public function isActive(string $gateway): bool
    {
        return $this->activeGateway() === $gateway;
    }

    /**
     * The decrypted configuration of the given gateway.
     *
     * @return array<string, mixed>
     */
    public function config(string $gateway): array
    {
        return PaymentGatewayConfig::where('gateway', $gateway)->value('config') ?? [];
    }

    /**
     * Whether all secret fields of the gateway are filled in.
     */
    public function isConfigured(string $gateway): bool
    {
        $config = $this->config($gateway);

        return collect($this->requiredFields($gateway))
            ->every(fn (string $field) => filled($config[$field] ?? null));
    }

    /**
     * Whether each secret field of the gateway currently holds a value.
     *
     * @return array<string, bool>
     */
    public function configuredFields(string $gateway): array
    {
        $config = $this->config($gateway);

        return collect($this->maskedFields($gateway))
            ->mapWithKeys(fn (string $field) => [$field => filled($config[$field] ?? null)])
            ->all();
    }

    /**
     * Save the configuration for a gateway, preserving unknown values and
     * optionally activating it at the same time.
     *
     * @param  array<string, mixed>  $config
     */
    public function save(string $gateway, array $config, bool $activate = false): PaymentGatewayConfig
    {
        if ($activate) {
            PaymentGatewayConfig::query()->update(['is_active' => false]);
        }

        $model = PaymentGatewayConfig::firstOrNew(['gateway' => $gateway]);

        $model->config = array_merge($model->config ?? [], $config);
        $model->is_active = $activate || $model->is_active;
        $model->save();

        return $model;
    }

    /**
     * The fields that must be filled before a gateway can be used.
     *
     * @return list<string>
     */
    public function requiredFields(string $gateway): array
    {
        return $this->maskedFields($gateway);
    }

    /**
     * The fields that hold secret values and must never leave the server.
     *
     * @return list<string>
     */
    public function maskedFields(string $gateway): array
    {
        return match ($gateway) {
            self::XENDIT => ['secret_key', 'publishable_key', 'webhook_token'],
            self::MIDTRANS => ['server_key', 'client_key'],
            default => [],
        };
    }

    /**
     * The default webhook URL the gateway should call into this application.
     */
    public function defaultWebhookUrl(string $gateway): string
    {
        return rtrim((string) config('app.url'), '/')."/api/webhooks/{$gateway}";
    }
}
