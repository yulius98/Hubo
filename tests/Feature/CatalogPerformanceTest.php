<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Produk;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();

    $this->owner = createUserWithGlobalRole('owner outlet');
    $this->company = Company::factory()->create();
    $this->outlet = createOutlet(['company_id' => $this->company->id, 'slug' => 'toko-perf']);
    $this->owner->outlets()->attach($this->outlet->id, ['role_id' => roleId('owner outlet')]);

    $this->kategori = Kategori::create(['id_user' => $this->owner->id, 'kategori' => 'Katalog']);
    $this->kategori->outlets()->attach($this->outlet->id);
});

function createProdukWith(int $count = 1): void
{
    Produk::factory()->count($count)->create([
        'id_outlet' => test()->outlet->id,
        'id_kategori' => test()->kategori->id,
        'stok' => 10,
    ]);
}

it('renders the welcome page', function () {
    createProdukWith(3);

    $this->get(route('welcome'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});

it('limits the welcome catalog to a small set instead of loading everything', function () {
    createProdukWith(20);

    $this->get(route('welcome'))->assertOk();

    $catalog = Cache::get('welcome.catalog');

    expect($catalog[1])->toHaveCount(12);
});

it('caches the welcome catalog between requests', function () {
    createProdukWith(3);

    $this->get(route('welcome'))->assertOk();

    $before = Cache::get('welcome.catalog');

    createProdukWith(3);

    $this->get(route('welcome'))->assertOk();

    expect(Cache::get('welcome.catalog'))->toBe($before);
});

it('caches the storefront categories per outlet', function () {
    $this->get(route('storefront', ['slug' => 'toko-perf']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('storefront/index'));

    expect(Cache::has('storefront.kategoris.'.$this->outlet->id))->toBeTrue();
});

it('serves the app home on the fixed homepage route', function () {
    createProdukWith(2);

    $this->actingAs($this->owner)
        ->get(route('homepage'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});
