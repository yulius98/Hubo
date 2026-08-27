<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingConfig;
use App\Services\ShippingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShippingSettingsController extends Controller
{
    public function __construct(protected ShippingService $shipping) {}

    public function index(): Response
    {
        $config = ShippingConfig::first();

        return Inertia::render('admin/shipping-settings', [
            'config' => [
                'api_key' => $config?->api_key ? '••••••••' : null,
                'origin_city_id' => $config?->origin_city_id,
                'origin_province' => $config?->origin_province,
            ],
            'configured' => $this->shipping->isConfigured(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'api_key' => ['required', 'string'],
            'origin_city_id' => ['nullable', 'string'],
            'origin_province' => ['nullable', 'string'],
        ]);

        $existing = ShippingConfig::first();

        $apiKey = $validated['api_key'];
        if ($apiKey === '••••••••') {
            $apiKey = $existing?->api_key;
        }

        $this->shipping->save(
            $apiKey,
            $validated['origin_city_id'] ?? $existing?->origin_city_id,
            $validated['origin_province'] ?? $existing?->origin_province,
        );

        return redirect()->back()->with('success', 'Pengiriman pengaturan berhasil disimpan.');
    }
}
