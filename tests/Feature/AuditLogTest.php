<?php

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Kategori;
use App\Models\Produk;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TenantService;

function actingAsUser(): User
{
    $user = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();

    $user->update(['company_id' => $company->id]);

    app(TenantService::class)->setCurrent($company);

    auth()->login($user);

    return $user;
}

function makeProduk(?User $owner = null): Produk
{
    $company = Company::factory()->create();
    $outlet = createOutlet(['company_id' => $company->id]);
    $owner ??= createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);

    return Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
    ]);
}

it('records an audit entry for an authenticated action', function () {
    actingAsUser();

    $produk = makeProduk();
    $audit = app(AuditService::class)->record($produk, AuditLog::EVENT_CREATED);

    expect($audit)->not->toBeNull();
    expect($audit->event)->toBe('created');
    expect($audit->auditable_type)->toBe(Produk::class);
    expect($audit->auditable_id)->toBe($produk->id);
    expect($audit->user_id)->toBe(auth()->id());
    expect($audit->company_id)->not->toBeNull();
    expect($audit->description)->not->toBeNull();
});

it('stores old and new values on the audit entry', function () {
    actingAsUser();

    $produk = makeProduk();
    $audit = app(AuditService::class)->record(
        $produk,
        AuditLog::EVENT_UPDATED,
        old: ['nama_produk' => 'Lama'],
        new: ['nama_produk' => 'Baru'],
    );

    expect($audit->old_values)->toBe(['nama_produk' => 'Lama']);
    expect($audit->new_values)->toBe(['nama_produk' => 'Baru']);
});

it('skips auditing when no user is authenticated', function () {
    $produk = makeProduk();

    $audit = app(AuditService::class)->record($produk, AuditLog::EVENT_DELETED);

    expect($audit)->toBeNull();
    expect(AuditLog::query()->count())->toBe(0);
});

it('resolves the tenant from the authenticated user', function () {
    $user = actingAsUser();
    $companyId = $user->fresh()->company_id;

    $company = Company::find($companyId);
    $outlet = createOutlet(['company_id' => $companyId]);
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $companyId]);
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);

    $produk = Produk::factory()->create(['id_outlet' => $outlet->id, 'id_kategori' => $kategori->id]);

    app(AuditService::class)->record($produk, AuditLog::EVENT_CREATED);

    expect(AuditLog::query()->where('company_id', $companyId)->count())->toBeGreaterThanOrEqual(1);
});

it('records a free-form audit event without a bound model', function () {
    actingAsUser();

    $audit = app(AuditService::class)->log('login', 'Pengguna masuk ke aplikasi');

    expect($audit->event)->toBe('login');
    expect($audit->description)->toBe('Pengguna masuk ke aplikasi');
    expect($audit->auditable_type)->toBe('system');
    expect($audit->auditable_id)->toBeNull();
});
it('records audit entries automatically via observers', function () {
    $user = actingAsUser();
    $company = Company::factory()->create();
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Belanja '.fake()->unique()->word()]);
    $outlet = createOutlet(['company_id' => $company->id]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create(['id_outlet' => $outlet->id, 'id_kategori' => $kategori->id]);
    $produk->update(['nama_produk' => 'Nama Baru']);
    $produk->delete();

    foreach (['created', 'updated', 'deleted'] as $event) {
        expect(AuditLog::query()
            ->where('auditable_id', $produk->id)
            ->where('event', $event)
            ->count())->toBeGreaterThanOrEqual(1, "missing event {$event}");
    }
});

it('does not audit model changes made without a user', function () {
    $company = Company::factory()->create();

    expect(AuditLog::query()->count())->toBe(0);
});
