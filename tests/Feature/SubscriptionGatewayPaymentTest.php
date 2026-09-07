<?php

use App\Mail\SubscriptionBillingReminderMail;
use App\Mail\SubscriptionInvoicePaidMail;
use App\Models\Company;
use App\Models\Kategori;
use App\Models\KeranjangBelanjaUser;
use App\Models\Payment;
use App\Models\PaymentGatewayConfig;
use App\Models\Plan;
use App\Models\Produk;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use App\Services\SubscriptionBillingService;
use App\Services\SubscriptionService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

function seededBillingSubscription(string $planStatus = Subscription::STATUS_TRIAL): Subscription
{
    seedRoles();

    $company = Company::factory()->create();
    $plan = Plan::factory()->create(['price_monthly' => 149000, 'trial_days' => 14]);

    $subscription = app(SubscriptionService::class)->subscribe($company, $plan, $planStatus);

    $owner = createUserWithGlobalRole('owner outlet');
    $owner->update(['company_id' => $company->id]);

    return $subscription;
}

function activateXenditGateway(): void
{
    PaymentGatewayConfig::create([
        'gateway' => 'xendit',
        'config' => [
            'secret_key' => 'sk_test_xendit',
            'publishable_key' => 'pk_test',
            'webhook_token' => 'whsec_test',
        ],
        'is_active' => true,
    ]);
}

function settleTrialIntoInvoice(Subscription $subscription): SubscriptionInvoice
{
    CarbonImmutable::setTestNow(now()->addDays(15));

    app(SubscriptionBillingService::class)->settle($subscription->fresh());

    return $subscription->fresh()->invoices()->latest()->first();
}

it('creates a gateway payment with a payment URL when paying a pending invoice', function () {
    activateXenditGateway();

    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    Http::fake([
        'https://api.xendit.co/*' => Http::response([
            'id' => 'inv_xyz',
            'invoice_url' => 'https://checkout.xendit.co/web/inv',
            'status' => 'PENDING',
        ], 200),
    ]);

    $owner = User::where('company_id', $subscription->company_id)->first();

    $response = $this->actingAs($owner)
        ->post(route('billing.pay'), ['invoice_id' => $invoice->id]);

    $response->assertRedirect();

    $payment = Payment::where('subscription_invoice_id', $invoice->id)->first();

    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe('processing');
    expect($payment->gateway)->toBe('xendit');

    $this->assertSame('https://checkout.xendit.co/web/inv', $this->app['session']->get('payment_url'));

    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PENDING);
});

it('marks the invoice paid when a valid Xendit billing webhook arrives', function () {
    activateXenditGateway();

    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    $payment = Payment::create([
        'subscription_invoice_id' => $invoice->id,
        'payment_number' => 'PAY-20260907-0001',
        'gateway' => 'xendit',
        'payment_method' => 'subscription',
        'amount' => 149000,
        'status' => 'processing',
    ]);

    Mail::fake();

    $config = PaymentGatewayConfig::where('gateway', 'xendit')->value('config');

    $this->withHeader('x-callback-token', $config['webhook_token'])
        ->postJson(route('billing.webhook.xendit'), [
            'external_id' => $payment->payment_number,
            'status' => 'PAID',
        ])
        ->assertOk()
        ->assertJson(['status' => 'ok']);

    expect($payment->fresh()->status)->toBe('success');
    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PAID);
    expect($invoice->fresh()->paid_at)->not->toBeNull();
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);

    Mail::assertSent(SubscriptionInvoicePaidMail::class);
});

it('rejects billing webhooks when the Xendit callback token is invalid', function () {
    activateXenditGateway();

    $this->postJson(route('billing.webhook.xendit'), [
        'external_id' => 'PAY-20260907-0001',
        'status' => 'PAID',
    ])->assertUnauthorized();
});

it('settles an invoice via a valid Midtrans billing webhook and rejects bad signatures', function () {
    activateXenditGateway();
    PaymentGatewayConfig::create([
        'gateway' => 'midtrans',
        'config' => [
            'server_key' => 'MidtransServerKey123',
            'client_key' => 'MidtransClientKey',
        ],
        'is_active' => false,
    ]);

    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    $payment = Payment::create([
        'subscription_invoice_id' => $invoice->id,
        'payment_number' => 'PAY-20260907-0002',
        'gateway' => 'midtrans',
        'payment_method' => 'subscription',
        'amount' => 149000,
        'status' => 'processing',
    ]);

    $statusCode = '200';
    $grossAmount = '149000.00';
    $signature = hash('sha512', $payment->payment_number.$statusCode.$grossAmount.'MidtransServerKey123');

    $this->postJson(route('billing.webhook.midtrans'), [
        'order_id' => $payment->payment_number,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'fraud_status' => 'accept',
        'signature_key' => $signature,
    ])->assertOk();

    expect($payment->fresh()->status)->toBe('success');
    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PAID);
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);

    $this->postJson(route('billing.webhook.midtrans'), [
        'order_id' => $payment->payment_number,
        'status_code' => '200',
        'gross_amount' => $grossAmount,
        'signature_key' => 'forged-signature',
    ])->assertUnauthorized();
});

it('sends a reminder email for invoices due within the advance window', function () {
    Mail::fake();

    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    CarbonImmutable::setTestNow($invoice->period_end->copy()->subDays(1));

    $counts = app(SubscriptionBillingService::class)->processReminders();

    expect($counts['reminder_sent'])->toBe(1);
    Mail::assertSent(SubscriptionBillingReminderMail::class);

    $invoice->refresh();
    expect($invoice->metadata['reminder_sent_at'] ?? null)->not->toBeNull();

    $counts = app(SubscriptionBillingService::class)->processReminders();
    expect($counts['reminder_sent'])->toBe(0);
});

it('marks a pending invoice overdue and suspends the tenant after the due date', function () {
    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    CarbonImmutable::setTestNow($invoice->period_end->copy()->addDay());

    $counts = app(SubscriptionBillingService::class)->processReminders();

    expect($counts['overdue'])->toBe(1);
    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_OVERDUE);
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_EXPIRED);
    expect($subscription->company->fresh()->status)->toBe(Company::STATUS_EXPIRED);
});

it('blocks new online orders when the tenant is not active', function () {
    $subscription = seededBillingSubscription();
    $company = $subscription->company;
    $company->update(['status' => Company::STATUS_EXPIRED]);

    $outlet = createOutlet(['company_id' => $company->id]);
    $user = User::where('company_id', $company->id)->first();
    attachUserToOutlet($user, $outlet, 'owner outlet');

    $kategori = Kategori::create(['id_user' => $user->id, 'kategori' => 'Minuman']);
    $produk = Produk::factory()->create([
        'id_outlet' => $outlet->id,
        'id_kategori' => $kategori->id,
        'stok' => 10,
    ]);

    KeranjangBelanjaUser::create([
        'id_user' => $user->id,
        'id_kategori' => $kategori->id,
        'id_produk' => $produk->id,
        'jumlah_produk' => 1,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'shipping_address' => 'Jl. Contoh No. 5',
            'payment_method' => 'bank_transfer',
            'shipping_cost' => 0,
            'courier' => 'REG',
        ])
        ->assertSessionHasErrors('billing');
});

it('falls back to the in-app flow when no gateway is configured', function () {
    $subscription = seededBillingSubscription();
    $invoice = settleTrialIntoInvoice($subscription);

    $owner = User::where('company_id', $subscription->company_id)->first();

    $this->actingAs($owner)
        ->post(route('billing.pay'), ['invoice_id' => $invoice->id])
        ->assertRedirect();

    expect($invoice->fresh()->status)->toBe(SubscriptionInvoice::STATUS_PAID);
    expect($subscription->fresh()->status)->toBe(Subscription::STATUS_ACTIVE);
});

afterEach(function (): void {
    CarbonImmutable::setTestNow();
});
