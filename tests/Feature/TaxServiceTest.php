<?php

use App\Models\Order;
use App\Models\Produk;
use App\Models\User;
use App\Services\TaxService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('include tax extracts the embedded ppn from the price', function () {
    $tax = TaxService::lineTax(111000, 1, 11, TaxService::MODE_INCLUDE);

    expect($tax)->toBe(11000.0);
});

test('exclude tax adds ppn on top of the price', function () {
    $tax = TaxService::lineTax(100000, 2, 11, TaxService::MODE_EXCLUDE);

    expect($tax)->toBe(22000.0);
});

test('tanpa pajak yields no tax even with a rate', function () {
    $tax = TaxService::lineTax(50000, 5, 11, TaxService::MODE_NONE);

    expect($tax)->toBe(0.0);
});

test('line tax is zero when ppn rate is zero', function () {
    expect(TaxService::lineTax(100000, 1, 0, TaxService::MODE_INCLUDE))->toBe(0.0);
});

test('tax code reflects product configuration', function () {
    expect(TaxService::taxCode(produkWithTax(TaxService::MODE_INCLUDE)))->toBe('PPN-DALAM')
        ->and(TaxService::taxCode(produkWithTax(TaxService::MODE_EXCLUDE)))->toBe('PPN-LUAR')
        ->and(TaxService::taxCode(produkWithTax(TaxService::MODE_NONE)))->toBe('NON-PPN');
});

test('order tax breakdown groups taxable values per tax code', function () {
    $order = Order::create([
        'order_number' => 'INV-'.uniqid(),
        'user_id' => User::factory()->create()->id,
        'status' => 'completed',
        'subtotal' => 111000,
        'shipping_cost' => 0,
        'discount' => 0,
        'tax' => 11000,
        'total' => 111000,
        'tax_breakdown' => [
            ['tax_code' => 'PPN-DALAM', 'tax_rate' => 11, 'taxable' => 111000, 'tax' => 11000],
        ],
    ]);

    expect($order->tax_breakdown)->toBeArray()
        ->and($order->tax_breakdown[0]['tax_code'])->toBe('PPN-DALAM')
        ->and($order->tax_breakdown[0]['tax'])->toBe(11000);
});

function produkWithTax(string $mode): Produk
{
    $produk = new Produk;
    $produk->ppn = 11;
    $produk->tax = $mode;

    return $produk;
}
