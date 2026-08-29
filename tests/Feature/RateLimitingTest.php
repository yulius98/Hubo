<?php

use App\Models\Company;

it('limits repeated webhook requests', function () {
    $response = null;

    for ($i = 0; $i < 31; $i++) {
        $response = $this->withHeader('Accept', 'application/json')
            ->postJson(route('webhooks.xendit'), []);

        if ($response->status() === 429) {
            break;
        }
    }

    expect($response)->not->toBeNull();
    expect($response->status())->toBe(429);
});

it('rate limits the authentication endpoint against brute force', function () {
    $response = null;

    for ($i = 0; $i < 6; $i++) {
        $response = $this->get('/authenticate?error=access_denied');

        if ($response->status() === 429) {
            break;
        }
    }

    expect($response)->not->toBeNull();
    expect($response->status())->toBe(429);
});

it('rate limits checkout submissions per user', function () {
    $owner = createUserWithGlobalRole('owner outlet');
    $company = Company::factory()->create();
    $owner->update(['company_id' => $company->id]);

    $this->actingAs($owner);

    $response = null;

    for ($i = 0; $i < 11; $i++) {
        $response = $this->post(route('checkout.store'), []);

        if ($response->status() === 429) {
            break;
        }
    }

    expect($response)->not->toBeNull();
    expect($response->status())->toBe(429);
});
