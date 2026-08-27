<?php

use App\Models\Company;
use App\Models\Expense;
use App\Models\User;

beforeEach(function () {
    $this->admin = createUserWithGlobalRole('super admin');
    $this->company = Company::factory()->create();
    $this->outlet = createOutlet(['company_id' => $this->company->id]);
});

it('allows super admin to list expenses', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.expenses'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/expenses'));
});

it('allows super admin to create an expense', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.expenses.store'), [
            'outlet_id' => $this->outlet->id,
            'kategori' => 'listrik',
            'jumlah' => 500000,
            'keterangan' => 'Tagihan listrik bulanan',
            'tanggal' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'kategori' => 'listrik',
        'jumlah' => 500000,
    ]);
});

it('allows super admin to update an expense', function () {
    $expense = Expense::factory()->create([
        'company_id' => $this->company->id,
        'outlet_id' => $this->outlet->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.expenses.update', $expense), [
            'kategori' => 'gaji',
            'jumlah' => 1000000,
            'keterangan' => 'Gaji karyawan',
            'tanggal' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('expenses', [
        'id' => $expense->id,
        'kategori' => 'gaji',
        'jumlah' => 1000000,
    ]);
});

it('allows super admin to delete an expense', function () {
    $expense = Expense::factory()->create([
        'company_id' => $this->company->id,
        'outlet_id' => $this->outlet->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.expenses.destroy', $expense))
        ->assertRedirect();

    $this->assertSoftDeleted('expenses', ['id' => $expense->id]);
});

it('prevents non-admin from accessing expenses', function () {
    $plainUser = User::factory()->create();

    $this->actingAs($plainUser)
        ->get(route('admin.expenses'))
        ->assertForbidden();
});
