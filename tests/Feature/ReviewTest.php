<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\Review;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createReviewProduk(Outlet $outlet, User $user): Produk
{
    $kategori = Kategori::create(['id_user' => $user->id, 'kategori' => 'Review '.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    return Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Ulasan',
        'harga_beli' => 10000,
        'margin' => 25,
        'harga' => 12500,
        'diskon' => 'no',
        'stok' => 10,
    ]);
}

function markProdukPurchased(User $user, Outlet $outlet, Produk $produk): Order
{
    $order = Order::create([
        'order_number' => 'ORD-RVW-'.fake()->unique()->numberBetween(1000, 9999),
        'user_id' => $user->id,
        'outlet_id' => $outlet->id,
        'status' => 'completed',
        'subtotal' => 12500,
        'total' => 12500,
        'shipping_address' => 'Jl. Test No. 1',
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'produk_id' => $produk->id,
        'product_name' => $produk->nama_produk,
        'price' => 12500,
        'quantity' => 1,
        'subtotal' => 12500,
    ]);

    return $order;
}

it('shares reviews on the product detail page', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $admin = createUserWithGlobalRole('super admin');
    $produk = createReviewProduk($outlet, $admin);
    $buyer = User::factory()->create();

    $review = Review::create([
        'produk_id' => $produk->id,
        'user_id' => $buyer->id,
        'rating' => 5,
        'review' => 'Produknya bagus sekali!',
    ]);

    $this->get(route('produk.detail', $produk))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('produk/detail')
            ->where('review_count', 1)
            ->where('can_review', false)
            ->where('my_review', null)
            ->where('reviews.0.rating', $review->rating)
            ->where('reviews.0.review', 'Produknya bagus sekali!'));
});

it('allows a buyer to submit a review for a purchased product', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $admin = createUserWithGlobalRole('super admin');
    $produk = createReviewProduk($outlet, $admin);
    $buyer = User::factory()->create();

    $order = markProdukPurchased($buyer, $outlet, $produk);

    $this->actingAs($buyer)
        ->post(route('produk.reviews.store', $produk), [
            'order_id' => $order->id,
            'rating' => 4,
            'review' => 'Kualitas bagus, pengiriman cepat.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('reviews', [
        'produk_id' => $produk->id,
        'user_id' => $buyer->id,
        'order_id' => $order->id,
        'rating' => 4,
    ]);

    expect($produk->fresh()->rating)->toBe(4.0);
});

it('recomputes the product rating across multiple reviews', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $admin = createUserWithGlobalRole('super admin');
    $produk = createReviewProduk($outlet, $admin);
    $buyerA = User::factory()->create();
    $buyerB = User::factory()->create();

    Review::create(['produk_id' => $produk->id, 'user_id' => $buyerA->id, 'rating' => 5]);
    Review::create(['produk_id' => $produk->id, 'user_id' => $buyerB->id, 'rating' => 3]);

    $produk->recalculateRating();

    expect($produk->fresh()->rating)->toBe(4.0);
});

it('forbids a user who never purchased the product from reviewing it', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $admin = createUserWithGlobalRole('super admin');
    $produk = createReviewProduk($outlet, $admin);
    $stranger = User::factory()->create();

    $this->actingAs($stranger)
        ->post(route('produk.reviews.store', $produk), [
            'rating' => 5,
            'review' => 'Coba curang',
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('reviews', 0);
});

it('shows my review and review capability to the purchasing user', function () {
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $admin = createUserWithGlobalRole('super admin');
    $produk = createReviewProduk($outlet, $admin);
    $buyer = User::factory()->create();

    $order = markProdukPurchased($buyer, $outlet, $produk);

    Review::create([
        'produk_id' => $produk->id,
        'user_id' => $buyer->id,
        'order_id' => $order->id,
        'rating' => 5,
        'review' => 'Sangat direkomendasikan.',
    ]);

    $this->actingAs($buyer)
        ->get(route('produk.detail', $produk))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('produk/detail')
            ->where('can_review', true)
            ->where('my_review.rating', 5)
            ->where('my_review.review', 'Sangat direkomendasikan.'));
});
