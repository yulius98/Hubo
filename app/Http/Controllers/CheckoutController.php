<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\KeranjangBelanjaUser;
use App\Services\OrderService;
use App\Services\PaymentGatewayProcessor;
use App\Services\PaymentGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected PaymentGatewayProcessor $processor,
        protected PaymentGatewayService $gateways,
    ) {}

    /**
     * Show the checkout page with cart summary.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $cartItems = KeranjangBelanjaUser::query()
            ->where('id_user', $user->id)
            ->where('status', 'pending')
            ->with('produk:id,nama_produk,gambar,harga,harga_diskon,stok,id_outlet')
            ->get()
            ->map(function (KeranjangBelanjaUser $item) {
                $harga = $item->produk?->harga_diskon ?? $item->produk?->harga ?? 0;

                return [
                    'id' => $item->id,
                    'id_produk' => $item->id_produk,
                    'nama_produk' => $item->produk?->nama_produk ?? 'Produk dihapus',
                    'gambar' => $item->produk?->gambar,
                    'harga' => (int) ($item->produk?->harga ?? 0),
                    'harga_diskon' => $item->produk?->harga_diskon,
                    'jumlah' => (int) $item->jumlah_produk,
                    'subtotal' => (int) ($harga * $item->jumlah_produk),
                ];
            })
            ->values()
            ->all();

        if (empty($cartItems)) {
            return redirect()->route('pesanan_saya')
                ->with('error', 'Keranjang belanja kosong.');
        }

        $subtotal = (int) collect($cartItems)->sum('subtotal');
        $tax = (int) ($subtotal * 0.11);
        $total = $subtotal + $tax;

        $activeGateway = $this->gateways->activeGateway();

        return Inertia::render('checkout', [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'active_gateway' => $activeGateway,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Process the checkout and create an order.
     */
    public function store(CheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $order = $this->orderService->createFromCart(
            userId: $request->user()->id,
            shippingAddress: $validated['shipping_address'],
            notes: $validated['notes'] ?? null,
            paymentMethod: $validated['payment_method'],
        );

        $paymentUrl = null;

        if ($this->gateways->activeGateway()) {
            try {
                $payment = $this->processor->createPayment($order);
                $paymentUrl = $this->processor->getPaymentUrl($payment);
            } catch (\Exception $e) {
                return redirect()->back()
                    ->with('error', 'Gagal memproses pembayaran: '.$e->getMessage());
            }
        }

        return redirect()->route('orders.show', $order->id)
            ->with('success', 'Pesanan berhasil dibuat!')
            ->with('payment_url', $paymentUrl);
    }
}
