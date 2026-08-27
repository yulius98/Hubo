<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReturnRequest;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Services\ReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReturnController extends Controller
{
    public function __construct(protected ReturnService $returns) {}

    public function index(Request $request): Response
    {
        $returns = OrderReturn::query()
            ->whereHas('order', fn ($query) => $query->where('user_id', $request->user()->id))
            ->with('order:id,order_number,status')
            ->latest()
            ->paginate(10);

        return Inertia::render('orders/returns', [
            'returns' => $returns,
        ]);
    }

    public function store(ReturnRequest $request): RedirectResponse
    {
        $order = Order::findOrFail($request->input('order_id'));

        abort_if($order->user_id !== $request->user()->id, 403);

        $this->returns->requestReturn(
            $order,
            $request->input('items'),
            $request->input('reason'),
        );

        return redirect()->back()->with('success', 'Permintaan retur berhasil dikirim.');
    }

    public function show(OrderReturn $return): Response
    {
        $return->load([
            'order',
            'items.orderItem',
            'items.produk',
        ]);

        return Inertia::render('orders/return-detail', [
            'return' => $return,
        ]);
    }

    public function approve(OrderReturn $return): RedirectResponse
    {
        abort_if($return->order->user_id !== auth()->id(), 403);

        $this->returns->approveReturn($return);

        return redirect()->back()->with('success', 'Retur berhasil disetujui.');
    }

    public function reject(OrderReturn $return): RedirectResponse
    {
        abort_if($return->order->user_id !== auth()->id(), 403);

        $this->returns->rejectReturn($return);

        return redirect()->back()->with('success', 'Retur berhasil ditolak.');
    }

    public function complete(OrderReturn $return): RedirectResponse
    {
        abort_if($return->order->user_id !== auth()->id(), 403);

        $this->returns->completeReturn($return);

        return redirect()->back()->with('success', 'Retur berhasil diselesaikan.');
    }
}
