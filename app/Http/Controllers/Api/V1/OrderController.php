<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Public REST API — Order (read + light update).
 *
 * Scoped abilities: `order:read`, `order:update`
 *
 * @example GET  /api/v1/orders?page=1
 * @example GET  /api/v1/orders/42
 * @example PATCH /api/v1/orders/42  {"status":"shipped","tracking_number":"RESI-001"}
 */
class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $outletId = (int) $request->attributes->get('api_outlet_id');

        $orders = Order::query()
            ->with('items')
            ->where('outlet_id', $outletId)
            ->latest('created_at')
            ->paginate((int) $request->query('per_page', 15));

        return OrderResource::collection($orders);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        abort_if($order->outlet_id !== (int) $request->attributes->get('api_outlet_id'), 404);

        $order->load('items');

        return new OrderResource($order);
    }

    public function update(UpdateOrderRequest $request, Order $order): OrderResource
    {
        abort_if($order->outlet_id !== (int) $request->attributes->get('api_outlet_id'), 404);

        $order->forceFill([
            'status' => $request->validated('status', $order->status),
            'tracking_number' => $request->validated('tracking_number', $order->tracking_number),
            'courier' => $request->validated('courier', $order->courier),
        ])->save();

        $order->load('items');

        return new OrderResource($order);
    }
}
