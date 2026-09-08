<?php

use App\Models\Company;
use App\Models\Kategori;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Produk;
use App\Models\User;
use App\Notifications\TenantDataExportNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

function createTenantOwner(): array
{
    $owner = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create(['name' => 'Toko Sumber Rejeki']);
    $outlet = Outlet::create([
        'company_id' => $company->id,
        'nama_outlet' => 'Tokopedia Official',
        'alamat_outlet' => 'Jalan Kemanggisan No. 9',
        'kota' => 'Jakarta Barat',
        'telp' => '0811-2222-3333',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Peralatan Dapur']);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Wajan Anti Lengket 26cm',
        'harga_beli' => 40000,
        'margin' => 20000,
        'harga' => 60000,
        'stok' => 40,
        'min_stok' => 5,
    ]);

    $order = Order::forceCreate([
        'order_number' => 'ORD-A11-001',
        'user_id' => $owner->id,
        'outlet_id' => $outlet->id,
        'status' => 'paid',
        'subtotal' => 60000,
        'shipping_cost' => 8000,
        'total' => 68000,
        'payment_method' => 'bank_transfer',
        'shipping_address' => 'Jalan Mawar No. 3',
    ]);

    return [
        'owner' => $owner,
        'company' => $company,
        'outlet' => $outlet,
        'produk' => $produk,
        'order' => $order,
    ];
}

function createRivalTenant(): User
{
    $owner = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create(['name' => 'Toko Saingan']);
    $outlet = Outlet::create([
        'company_id' => $company->id,
        'nama_outlet' => 'Marketplace Lain',
        'alamat_outlet' => 'Jalan Sudirman No. 1',
        'kota' => 'Jakarta Selatan',
        'telp' => '0800-0000-0000',
    ]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');
    $owner->update(['company_id' => $company->id]);

    return $owner;
}

it('shows the data page for the owner', function () {
    $fixture = createTenantOwner();

    $this->actingAs($fixture['owner'])
        ->get(route('data.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/data')
            ->has('companyName')
            ->where('companyName', 'Toko Sumber Rejeki'));
});

it('hides the data page from staff without the owner role', function () {
    $fixture = createTenantOwner();
    $staff = User::factory()->create();
    attachUserToOutlet($staff, $fixture['outlet'], 'admin outlet');

    $this->actingAs($staff)
        ->get(route('data.index'))
        ->assertForbidden();
});

it('writes a full snapshot and notifies the owner on export', function () {
    Storage::fake('tenant-data');
    Notification::fake();

    $fixture = createTenantOwner();

    $this->actingAs($fixture['owner'])
        ->post(route('data.export'))
        ->assertRedirect()
        ->assertSessionHas('success');

    $files = Storage::disk('tenant-data')->files();
    expect($files)->toHaveCount(1);

    $payload = json_decode(Storage::disk('tenant-data')->get($files[0]), true);

    expect($payload['company']['name'])->toBe('Toko Sumber Rejeki')
        ->and($payload['outlets'][0]['nama_outlet'])->toBe('Tokopedia Official')
        ->and($payload['outlets'][0]['produks'][0]['nama_produk'])->toBe('Wajan Anti Lengket 26cm')
        ->and($payload['outlets'][0]['orders'][0]['order_number'])->toBe('ORD-A11-001')
        ->and($payload['staff'][0]['email'])->toBe($fixture['owner']->email);

    Notification::assertSentTo(
        $fixture['owner'],
        TenantDataExportNotification::class,
    );
});

it('lets the owner download an export through a signed URL', function () {
    Storage::fake('tenant-data');

    $fixture = createTenantOwner();

    $this->actingAs($fixture['owner'])->post(route('data.export'));

    $file = Storage::disk('tenant-data')->files()[0];
    $url = URL::temporarySignedRoute('data.download', now()->addHours(24), ['file' => $file]);

    $this->actingAs($fixture['owner'])
        ->get($url)
        ->assertOk()
        ->assertJsonPath('company.name', 'Toko Sumber Rejeki');
});

it('rejects unsigned download links', function () {
    Storage::fake('tenant-data');

    $fixture = createTenantOwner();

    $this->actingAs($fixture['owner'])
        ->get(route('data.download', ['file' => 'tenant-export-123.json']))
        ->assertForbidden();
});

it('does not purge data when the confirmation text differs', function () {
    $fixture = createTenantOwner();

    $this->actingAs($fixture['owner'])
        ->from(route('data.index'))
        ->delete(route('data.destroy'), ['confirmation' => 'salah'])
        ->assertRedirect(route('data.index'))
        ->assertSessionHasErrors('confirmation');

    expect(Company::find($fixture['company']->id))->not->toBeNull()
        ->and(Produk::find($fixture['produk']->id))->not->toBeNull();
});

it('purges the tenant after typed confirmation and signs the owner out', function () {
    $fixture = createTenantOwner();
    $rival = createRivalTenant();

    $this->actingAs($fixture['owner'])
        ->delete(route('data.destroy'), ['confirmation' => 'Toko Sumber Rejeki'])
        ->assertRedirect('/')
        ->assertSessionHas('status');

    expect(Company::find($fixture['company']->id))->toBeNull()
        ->and(User::find($fixture['owner']->id))->toBeNull()
        ->and(Outlet::find($fixture['outlet']->id))->toBeNull()
        ->and(Produk::find($fixture['produk']->id))->toBeNull()
        ->and(Order::find($fixture['order']->id))->toBeNull();

    $rivalFresh = $rival->fresh();
    expect($rivalFresh->company)->not->toBeNull();
    expect(Company::find($rivalFresh->company_id))->not->toBeNull();
});
