<?php

namespace App\Http\Controllers;

use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function __construct(protected ShippingService $shipping) {}

    public function calculateCost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination_city_id' => ['required', 'string'],
            'weight' => ['required', 'integer', 'min:1'],
            'courier' => ['required', 'string', 'in:jne,tiki,anteraja'],
        ]);

        $result = $this->shipping->calculateCost(
            destinationCityId: $validated['destination_city_id'],
            weightGram: $validated['weight'],
            courier: $validated['courier'],
        );

        if ($result['error']) {
            return response()->json(['error' => $result['error']], 422);
        }

        return response()->json(['costs' => $result['costs']]);
    }
}
