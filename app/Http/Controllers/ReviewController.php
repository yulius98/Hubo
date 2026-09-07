<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Models\Order;
use App\Models\Produk;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;

class ReviewController extends Controller
{
    /**
     * Store a review for a purchased product.
     */
    public function store(StoreReviewRequest $request, Produk $produk): RedirectResponse
    {
        $validated = $request->validated();

        $hasPurchased = Order::query()
            ->where('user_id', $request->user()->id)
            ->whereHas('items', fn ($query) => $query->where('produk_id', $produk->id))
            ->whereIn('status', ['paid', 'processing', 'shipped', 'completed'])
            ->exists();

        abort_unless($hasPurchased, 403, 'Anda hanya dapat memberi ulasan untuk produk yang sudah dibeli.');

        $orderId = $request->input('order_id');

        if (! empty($orderId)) {
            $ownsOrder = Order::query()
                ->where('id', $orderId)
                ->where('user_id', $request->user()->id)
                ->whereHas('items', fn ($query) => $query->where('produk_id', $produk->id))
                ->exists();

            abort_unless($ownsOrder, 403, 'Order tidak valid untuk produk ini.');
        }

        Review::updateOrCreate(
            [
                'produk_id' => $produk->id,
                'user_id' => $request->user()->id,
            ],
            [
                'order_id' => $orderId ?: null,
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
            ]
        );

        $produk->recalculateRating();

        return redirect()->back()->with('success', 'Ulasan berhasil disimpan. Terima kasih!');
    }
}
