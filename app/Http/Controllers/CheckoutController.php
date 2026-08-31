<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\Customer;
use App\Models\KeranjangBelanjaUser;
use App\Models\ShippingConfig;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\OrderService;
use App\Services\PaymentGatewayProcessor;
use App\Services\PaymentGatewayService;
use App\Services\ShippingService;
use App\Services\TaxService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected PaymentGatewayProcessor $processor,
        protected PaymentGatewayService $gateways,
        protected LoyaltyService $loyalty,
        protected ShippingService $shipping,
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
            ->with('produk:id,nama_produk,gambar,harga,harga_diskon,stok,id_outlet,ppn,tax', 'variant:id,produk_id,nama,sku,harga,stok')
            ->get()
            ->map(function (KeranjangBelanjaUser $item) {
                $harga = (float) ($item->variant?->harga ?? $item->produk?->harga_diskon ?? $item->produk?->harga ?? 0);
                $tax = TaxService::lineTax($harga, (int) $item->jumlah_produk, (float) ($item->produk?->ppn ?? 0), $item->produk?->tax ?? 'tanpa pajak');

                return [
                    'id' => $item->id,
                    'id_produk' => $item->id_produk,
                    'variant_id' => $item->variant_id,
                    'nama_produk' => $item->variant?->nama
                        ? $item->produk?->nama_produk.' - '.$item->variant->nama
                        : ($item->produk?->nama_produk ?? 'Produk dihapus'),
                    'gambar' => $item->produk?->gambar,
                    'harga' => (int) ($item->produk?->harga ?? 0),
                    'harga_diskon' => $item->produk?->harga_diskon,
                    'jumlah' => (int) $item->jumlah_produk,
                    'subtotal' => (int) ($harga * $item->jumlah_produk),
                    'tax' => round($tax, 2),
                    'tax_code' => TaxService::taxCode($item->produk),
                ];
            })
            ->values()
            ->all();

        if (empty($cartItems)) {
            return redirect()->route('pesanan_saya')
                ->with('error', 'Keranjang belanja kosong.');
        }

        $subtotal = (int) collect($cartItems)->sum('subtotal');
        $tax = (float) collect($cartItems)->sum('tax');
        $total = $subtotal + $tax;

        $customer = Customer::query()
            ->where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        $pointsBalance = $customer?->points ?? 0;

        $activeGateway = $this->gateways->activeGateway();
        $shippingConfigured = ShippingConfig::isConfigured();

        return Inertia::render('checkout', [
            'cartItems' => $cartItems,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'active_gateway' => $activeGateway,
            'shipping_configured' => $shippingConfigured,
            'user_points_balance' => (int) $pointsBalance,
            'min_redeem_points' => LoyaltyService::MIN_REDEEM,
            'point_value' => LoyaltyService::POINT_VALUE,
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

        try {
            $shippingCost = $this->verifiedShippingCost($request->user(), $validated);

            $order = $this->orderService->createFromCart(
                userId: $request->user()->id,
                shippingAddress: $validated['shipping_address'],
                notes: $validated['notes'] ?? null,
                paymentMethod: $validated['payment_method'],
                shippingCost: $shippingCost,
                courier: $validated['courier'] ?? null,
                couponCode: $validated['coupon_code'] ?? null,
                points: (int) ($validated['points'] ?? 0),
            );
        } catch (ValidationException $e) {
            return redirect()->back()
                ->withInput()
                ->withErrors($e->errors());
        }

        $paymentUrl = null;

        if ($this->gateways->activeGateway()) {
            try {
                $payment = $this->processor->createPayment($order);
                $paymentUrl = $this->processor->getPaymentUrl($payment);
            } catch (\Exception $e) {
                return redirect()->route('orders.show', $order->id)
                    ->with('error', 'Pesanan berhasil dibuat, tetapi gagal memproses pembayaran: '.$e->getMessage());
            }
        }

        return redirect()->route('orders.show', $order->id)
            ->with('success', 'Pesanan berhasil dibuat!')
            ->with('payment_url', $paymentUrl);
    }

    /**
     * Verify the submitted shipping cost against a fresh RajaOngkir quote,
     * so the client cannot tamper with the amount.
     *
     * @param  array<string, mixed>  $validated
     */
    private function verifiedShippingCost(?User $user, array $validated): float
    {
        if (! $this->shipping->isConfigured()) {
            return 0.0;
        }

        $cost = (float) ($validated['shipping_cost'] ?? 0);

        if ($cost <= 0) {
            return 0.0;
        }

        $courierCode = (string) ($validated['shipping_courier_code'] ?? '');
        $destinationCityId = (string) ($validated['shipping_destination_city_id'] ?? '');
        $service = (string) ($validated['courier'] ?? '');

        if ($courierCode === '' || $destinationCityId === '' || $service === '') {
            throw ValidationException::withMessages([
                'shipping_cost' => 'Metode pengiriman tidak valid.',
            ]);
        }

        $weightGram = $user === null
            ? 0
            : (int) KeranjangBelanjaUser::query()
                ->where('id_user', $user->id)
                ->where('status', 'pending')
                ->sum(DB::raw('jumlah_produk * '.(int) config('shipping.unit_weight_gram', 500)));

        $result = $this->shipping->calculateCost($destinationCityId, max(1, $weightGram), $courierCode);

        $match = collect($result['costs'] ?? [])
            ->first(fn (array $option) => ($option['service'] ?? null) === $service);

        if ($match === null) {
            throw ValidationException::withMessages([
                'shipping_cost' => 'Layanan pengiriman tidak valid.',
            ]);
        }

        $expected = (float) ($match['cost'][0]['value'] ?? 0);

        if (abs($expected - $cost) > 0.01) {
            throw ValidationException::withMessages([
                'shipping_cost' => 'Biaya pengiriman tidak valid.',
            ]);
        }

        return $cost;
    }
}
