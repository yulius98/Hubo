<?php

use App\Models\ShippingConfig;
use App\Models\User;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
});

it('allows super admin to view shipping settings page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.shipping-settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/shipping-settings'));
});

it('allows super admin to update shipping settings', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.shipping-settings.update'), [
            'api_key' => 'test-api-key-123',
            'origin_city_id' => '152',
            'origin_province' => 'DKI Jakarta',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('shipping_configs', [
        'origin_city_id' => '152',
        'origin_province' => 'DKI Jakarta',
    ]);
});

it('masks API key when already configured', function () {
    ShippingConfig::create([
        'api_key' => 'secret-key',
        'origin_city_id' => '152',
        'origin_province' => 'DKI Jakarta',
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.shipping-settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('config.api_key', '••••••••')
            ->where('configured', true));
});

it('prevents non-admin from accessing shipping settings', function () {
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)
        ->get(route('admin.shipping-settings'))
        ->assertForbidden();
});
