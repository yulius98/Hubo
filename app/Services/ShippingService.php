<?php

namespace App\Services;

use App\Models\ShippingConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingService
{
    private const BASE_URL = 'https://api.rajaongkir.com/starter';

    public function isConfigured(): bool
    {
        return ShippingConfig::isConfigured();
    }

    public function getApiKey(): ?string
    {
        return ShippingConfig::getApiKey();
    }

    public function getOriginCityId(): ?string
    {
        return ShippingConfig::getOriginCityId();
    }

    /**
     * Calculate shipping cost from origin to destination.
     *
     * @return array{costs: list<array>, error: ?string}
     */
    public function calculateCost(string $destinationCityId, int $weightGram, string $courier): array
    {
        $apiKey = $this->getApiKey();
        $originCityId = $this->getOriginCityId();

        if (! $apiKey || ! $originCityId) {
            return ['costs' => [], 'error' => 'Shipping API belum dikonfigurasi.'];
        }

        try {
            $response = Http::withHeaders([
                'key' => $apiKey,
            ])->post(self::BASE_URL.'/cost', [
                'origin' => $originCityId,
                'destination' => $destinationCityId,
                'weight' => $weightGram,
                'courier' => $courier,
            ]);

            if ($response->failed()) {
                Log::error('RajaOngkir API error: '.$response->body());

                return ['costs' => [], 'error' => 'Gagal menghitung ongkir.'];
            }

            $data = $response->json('rajaongkir');

            return ['costs' => $data['results'][0]['costs'] ?? [], 'error' => null];
        } catch (\Exception $e) {
            Log::error('RajaOngkir API exception: '.$e->getMessage());

            return ['costs' => [], 'error' => 'Gagal menghubungi API ongkir.'];
        }
    }

    /**
     * Get list of provinces.
     */
    public function getProvinces(): array
    {
        $apiKey = $this->getApiKey();

        if (! $apiKey) {
            return [];
        }

        try {
            $response = Http::withHeaders(['key' => $apiKey])->get(self::BASE_URL.'/province');

            return $response->json('rajaongkir.results') ?? [];
        } catch (\Exception $e) {
            Log::error('RajaOngkir province error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Get list of cities in a province.
     */
    public function getCities(string $provinceId): array
    {
        $apiKey = $this->getApiKey();

        if (! $apiKey) {
            return [];
        }

        try {
            $response = Http::withHeaders(['key' => $apiKey])->get(self::BASE_URL.'/city', [
                'province' => $provinceId,
            ]);

            return $response->json('rajaongkir.results') ?? [];
        } catch (\Exception $e) {
            Log::error('RajaOngkir city error: '.$e->getMessage());

            return [];
        }
    }

    /**
     * Save the shipping configuration.
     */
    public function save(string $apiKey, ?string $originCityId = null, ?string $originProvince = null): void
    {
        ShippingConfig::updateOrCreate(['id' => 1], [
            'api_key' => $apiKey,
            'origin_city_id' => $originCityId,
            'origin_province' => $originProvince,
        ]);
    }
}
