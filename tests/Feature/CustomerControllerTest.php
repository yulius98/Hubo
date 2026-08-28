<?php

use App\Models\Company;
use App\Models\Customer;
use App\Models\Outlet;
use Inertia\Testing\AssertableInertia as Assert;

function createOwnerWithCompany(Outlet $outlet): array
{
    $owner = attachUserToOutlet(createUserWithGlobalRole('owner outlet'), $outlet, 'owner outlet');
    $company = Company::factory()->create();
    $outlet->update(['company_id' => $company->id]);

    return [$owner, $company];
}

it('lists customers for the company', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    Customer::factory()->create(['company_id' => $company->id, 'outlet_id' => $outlet->id]);

    $this->actingAs($owner)
        ->get(route('customers'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('akun_users/customers')
            ->has('customers.data', 1));
});

it('creates a customer', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    $this->actingAs($owner)
        ->post(route('customers.add'), [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone' => '081234567890',
            'address' => 'Jl. Melati No. 3',
            'outlet_id' => $outlet->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('customers', [
        'company_id' => $company->id,
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
    ]);
});

it('prevents creating a customer with a duplicate email within the company', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    Customer::factory()->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'email' => 'sama@example.com',
    ]);

    $this->actingAs($owner)
        ->post(route('customers.add'), [
            'name' => 'User Lain',
            'email' => 'sama@example.com',
        ])
        ->assertSessionHasErrors('email');

    expect(Customer::count())->toBe(1);
});

it('updates a customer', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    $customer = Customer::factory()->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
        'name' => 'Lama',
    ]);

    $this->actingAs($owner)
        ->put(route('customers.update', $customer), [
            'name' => 'Baru',
            'email' => $customer->email,
            'phone' => '0811',
            'address' => 'Jl. Baru',
            'outlet_id' => $outlet->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($customer->fresh()->name)->toBe('Baru');
});

it('deletes a customer', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    $customer = Customer::factory()->create([
        'company_id' => $company->id,
        'outlet_id' => $outlet->id,
    ]);

    $this->actingAs($owner)
        ->delete(route('customers.delete', $customer))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Customer::find($customer->id))->toBeNull();
});

it('forbids managing customers of another company', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    $otherOutlet = createOutlet();
    $customer = Customer::factory()->create([
        'company_id' => Company::factory()->create()->id,
        'outlet_id' => $otherOutlet->id,
    ]);

    $this->actingAs($owner)
        ->put(route('customers.update', $customer), [
            'name' => 'Hack',
            'email' => 'hack@example.com',
            'phone' => null,
            'address' => null,
            'outlet_id' => $outlet->id,
        ])
        ->assertForbidden();

    expect($customer->fresh()->name)->not->toBe('Hack');
});

it('requires the cashier role to be blocked from the customers page', function () {
    $outlet = createOutlet();
    [$owner, $company] = createOwnerWithCompany($outlet);

    $kasir = attachUserToOutlet(createUserWithGlobalRole('kasir'), $outlet, 'kasir');

    $this->actingAs($kasir)
        ->get(route('customers'))
        ->assertForbidden();
});
