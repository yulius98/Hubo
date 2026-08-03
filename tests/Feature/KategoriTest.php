<?php

use App\Models\Kategori;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

it('kategoris table has an id_outlet foreign key', function () {
    expect(Schema::hasColumn('kategoris', 'id_outlet'))->toBeTrue();

    $user = User::factory()->create();
    $outlet = createOutlet();
    $kategori = Kategori::create([
        'id_user' => $user->id,
        'id_outlet' => $outlet->id,
        'kategori' => 'Minuman',
    ]);

    expect($kategori->outlet)->not->toBeNull();
    expect($kategori->outlet->id)->toBe($outlet->id);
});

it('filters categories by the selected outlet', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');

    Kategori::create(['id_user' => $owner->id, 'id_outlet' => $outletA->id, 'kategori' => 'Kategori A']);
    Kategori::create(['id_user' => $owner->id, 'id_outlet' => $outletB->id, 'kategori' => 'Kategori B']);

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('kategori'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/kelola_kategori')
            ->where('jmlKategori', 1)
        );
});

it('stores the selected outlet id when creating a category', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    session(['selected_outlet_id' => $outlet->id]);

    $this->actingAs($owner)->post(route('kategori.add'), [
        'id_user' => $owner->id,
        'kategori' => 'Makanan',
    ])->assertRedirect();

    expect(Kategori::where('kategori', 'Makanan')->first()->id_outlet)->toBe($outlet->id);
});
