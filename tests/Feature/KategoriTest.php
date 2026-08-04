<?php

use App\Models\Kategori;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

it('a category can belong to many outlets and an outlet can have many categories', function () {
    expect(Schema::hasTable('kategori_outlet'))->toBeTrue();
    expect(Schema::hasColumn('kategoris', 'id_outlet'))->toBeFalse();

    $user = User::factory()->create();
    $outletA = createOutlet();
    $outletB = createOutlet();

    $kategori = Kategori::create([
        'id_user' => $user->id,
        'kategori' => 'Minuman',
    ]);
    $kategori->outlets()->attach([$outletA->id, $outletB->id]);

    expect($kategori->outlets->pluck('id'))->toContain($outletA->id);
    expect($kategori->outlets->pluck('id'))->toContain($outletB->id);
    expect($outletA->kategori->pluck('id'))->toContain($kategori->id);
    expect($outletB->kategori->pluck('id'))->toContain($kategori->id);
});

it('shows all categories on the kategori page regardless of selected outlet', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');

    $kategoriA = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori A']);
    $kategoriA->outlets()->attach($outletA->id);
    $kategoriB = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori B']);
    $kategoriB->outlets()->attach($outletB->id);

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('kategori'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/kelola_kategori')
            ->where('jmlKategori', 2)
            ->where('selectedOutletId', $outletA->id)
            ->has('kategoris', 2)
        );
});

it('pre-selects categories that already belong to the selected outlet', function () {
    $outletA = createOutlet(['nama_outlet' => 'Outlet A']);
    $outletB = createOutlet(['nama_outlet' => 'Outlet B']);
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outletA, 'owner outlet');
    $owner = attachUserToOutlet($owner, $outletB, 'owner outlet');

    $kategoriA = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori A']);
    $kategoriA->outlets()->attach($outletA->id);
    $kategoriB = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori B']);
    $kategoriB->outlets()->attach($outletB->id);

    session(['selected_outlet_id' => $outletA->id]);

    $this->actingAs($owner)
        ->get(route('kategori'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('kategoris', 2)
            ->has('kategoris.0.outlets')
            ->has('kategoris.1.outlets')
        );
});

it('saves the selected categories for an outlet', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $kategoriA = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori A']);
    $kategoriB = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori B']);
    $kategoriC = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori C']);

    $this->actingAs($owner)->post(route('kategori.save'), [
        'outlet_id' => $outlet->id,
        'kategori_ids' => [$kategoriA->id, $kategoriB->id],
    ])->assertRedirect();

    expect($outlet->fresh()->kategori->pluck('id'))->toContain($kategoriA->id);
    expect($outlet->fresh()->kategori->pluck('id'))->toContain($kategoriB->id);
    expect($outlet->fresh()->kategori->pluck('id'))->not->toContain($kategoriC->id);

    $this->actingAs($owner)->post(route('kategori.save'), [
        'outlet_id' => $outlet->id,
        'kategori_ids' => [$kategoriA->id],
    ])->assertRedirect();

    expect($outlet->fresh()->kategori->pluck('id'))->toContain($kategoriA->id);
    expect($outlet->fresh()->kategori->pluck('id'))->not->toContain($kategoriB->id);
});

it('denies saving categories for an outlet the user does not manage', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->post(route('kategori.save'), [
        'outlet_id' => $otherOutlet->id,
        'kategori_ids' => [],
    ])->assertForbidden();

    expect($otherOutlet->fresh()->kategori->count())->toBe(0);
});

it('stores the selected outlet ids when creating a category', function () {
    $outlet = createOutlet();
    $outletB = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $owner = attachUserToOutlet($owner, $outletB, 'owner outlet');

    $this->actingAs($owner)->post(route('kategori.add'), [
        'id_user' => $owner->id,
        'outlet_ids' => [$outlet->id, $outletB->id],
        'kategori' => 'Makanan',
    ])->assertRedirect();

    $kategori = Kategori::where('kategori', 'Makanan')->first();
    expect($kategori->outlets->pluck('id'))->toContain($outlet->id);
    expect($kategori->outlets->pluck('id'))->toContain($outletB->id);
});

it('denies creating a category for an outlet the user does not manage', function () {
    $outlet = createOutlet();
    $otherOutlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $this->actingAs($owner)->post(route('kategori.add'), [
        'id_user' => $owner->id,
        'outlet_ids' => [$otherOutlet->id],
        'kategori' => 'Minuman',
    ])->assertForbidden();

    expect(Kategori::where('kategori', 'Minuman')->doesntExist())->toBeTrue();
});

it('syncs outlets when updating a category', function () {
    $outletA = createOutlet();
    $outletB = createOutlet();
    $outletC = createOutlet();
    $owner = createUserWithGlobalRole('owner outlet');
    attachUserToOutlet($owner, $outletA, 'owner outlet');
    attachUserToOutlet($owner, $outletB, 'owner outlet');
    attachUserToOutlet($owner, $outletC, 'owner outlet');

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Minuman']);
    $kategori->outlets()->attach([$outletA->id, $outletB->id]);

    $this->actingAs($owner)->put(route('kategori.update', $kategori), [
        'id_user' => $owner->id,
        'outlet_ids' => [$outletA->id, $outletC->id],
        'kategori' => 'Minuman Updated',
    ])->assertRedirect();

    $kategori->refresh();
    expect($kategori->kategori)->toBe('Minuman Updated');
    expect($kategori->outlets->pluck('id'))->toContain($outletA->id);
    expect($kategori->outlets->pluck('id'))->toContain($outletC->id);
    expect($kategori->outlets->pluck('id'))->not->toContain($outletB->id);
});

it('soft deletes a category and keeps its pivot links for restore', function () {
    $outlet = createOutlet();
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Minuman']);
    $kategori->outlets()->attach($outlet->id);

    $this->actingAs($owner)->delete(route('kategori.delete', $kategori))->assertRedirect();

    expect(Kategori::find($kategori->id))->toBeNull();
    expect(Kategori::withTrashed()->find($kategori->id))->not->toBeNull();
    expect(DB::table('kategori_outlet')->where('id_kategori', $kategori->id)->exists())->toBeTrue();
});
