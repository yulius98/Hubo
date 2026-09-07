<?php

use App\Jobs\ExportFinancialReport;
use App\Jobs\RunDatabaseBackup;
use App\Jobs\SeedDemoCatalog;
use App\Jobs\SendMail;
use App\Mail\OrderConfirmedMail;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Produk;
use App\Models\User;
use App\Notifications\ReportReadyNotification;
use App\Services\FinancialReportService;
use App\Services\OrderService;
use Database\Seeders\DemoCatalogSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    seedRoles();
});

class FailingQueueTestJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function handle(): void
    {
        throw new RuntimeException('Sengaja gagal.');
    }

    public function failed(Throwable $e): void {}
}

it('queues a SendMail job for order confirms when the queue is faked', function () {
    Queue::fake();

    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori'.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Queue',
        'harga' => 50000,
        'harga_diskon' => null,
        'stok' => 10,
    ]);

    $buyer = User::factory()->create(['company_id' => $company->id]);
    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    Queue::assertPushed(SendMail::class, fn (SendMail $job) => $job->mailable instanceof OrderConfirmedMail
        && $job->recipient === $buyer->email);
});

it('delivers order confirmation mail inline when the queue is sync', function () {
    Mail::fake();

    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $kategori = Kategori::create(['id_user' => $owner->id, 'kategori' => 'Kategori'.fake()->unique()->word()]);
    $kategori->outlets()->attach($outlet->id);

    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'nama_produk' => 'Produk Sync Mail',
        'harga' => 50000,
        'harga_diskon' => null,
        'stok' => 10,
    ]);

    $buyer = User::factory()->create(['company_id' => $company->id]);
    Customer::create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'user_id' => $buyer->id,
        'name' => $buyer->name,
        'email' => $buyer->email,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $buyer->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($buyer);
    app(OrderService::class)->createFromCart($buyer->id, 'Jl. Test', 'bank_transfer');

    Mail::assertSent(OrderConfirmedMail::class);
});

it('records a failing job into the failed_jobs table', function () {
    config(['queue.default' => 'database']);

    Queue::push(new FailingQueueTestJob);

    Artisan::call('queue:work', ['connection' => 'database', '--once' => true]);

    expect(DB::table('failed_jobs')->count())->toBe(1);
});

it('runs the database backup through the console kernel', function () {
    $kernel = Mockery::mock(ConsoleKernel::class);
    $kernel->shouldReceive('call')->once()->with('app:backup-database')->andReturn(0);

    (new RunDatabaseBackup)->handle($kernel);
});

it('seeds a bulk demo catalog through the queued job', function () {
    $outlet = createOutlet();
    $company = $outlet->company;
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');

    $catalog = [
        ['nama_produk' => 'Produk A1', 'kategori' => 'Elektronik', 'harga' => 100000, 'harga_beli' => 70000, 'stok' => 5, 'sku' => 'A-1'],
        ['nama_produk' => 'Produk B2', 'kategori' => 'Elektronik', 'harga' => 200000, 'harga_beli' => 150000, 'stok' => 6, 'sku' => 'B-2'],
    ];

    (new SeedDemoCatalog($company->id, $owner->id, $outlet->id, $catalog))->handle();

    expect(Produk::where('id_outlet', $outlet->id)->count())->toBe(2);
});

it('dispatches the bulk seeding job when the demo catalog exceeds the threshold', function () {
    Queue::fake();
    config(['seed.bulk_threshold' => 1]);

    $company = Company::factory()->create(['slug' => 'demo-toko']);
    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['email' => 'demo.owner@yopmail.com']);
    $outlet = createOutlet(['company_id' => $company->id]);
    attachUserToOutlet($owner, $outlet, 'owner outlet');

    (new DemoCatalogSeeder)->run();

    Queue::assertPushed(SeedDemoCatalog::class);
});

it('generates an offline report file and notifies the requesting admin', function () {
    Storage::fake('reports');

    $outlet = createOutlet();
    $company = $outlet->company;
    $admin = createUserWithGlobalRole('super admin');

    $start = now()->startOfMonth()->toDateString();
    $end = now()->toDateString();

    $job = new ExportFinancialReport($admin->id, 'csv', $start, $end, $outlet->id);
    $job->handle(app(FinancialReportService::class));

    $notification = $admin->notifications()->latest()->first();
    expect($notification)->not->toBeNull();
    expect($notification->type)->toBe(ReportReadyNotification::class);

    $filename = $notification->data['filename'];
    $this->assertTrue(Storage::disk('reports')->exists($filename));
    $this->assertStringContainsString('.csv', $filename);

    $this->actingAs($admin)
        ->get(route('admin.reports.download', rawurlencode($filename)))
        ->assertOk();
});

it('queues the async report export and validates its payload', function () {
    Queue::fake();

    $outlet = createOutlet();
    $admin = createUserWithGlobalRole('super admin');

    $start = now()->startOfMonth()->toDateString();
    $end = now()->toDateString();

    $this->actingAs($admin)
        ->post(route('admin.reports.export-async'), [
            'format' => 'xlsx',
            'start_date' => $start,
            'end_date' => $end,
            'outlet_id' => $outlet->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    Queue::assertPushed(ExportFinancialReport::class, fn (ExportFinancialReport $job) => $job->userId === $admin->id
        && $job->format === 'xlsx');
});

it('rejects an invalid export format', function () {
    Queue::fake();

    $admin = createUserWithGlobalRole('super admin');

    $this->actingAs($admin)
        ->post(route('admin.reports.export-async'), [
            'format' => 'docx',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->toDateString(),
        ])
        ->assertSessionHasErrors('format');

    Queue::assertNothingPushed();
});
