<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Outlet;
use App\Models\Role;
use App\Services\AuditService;
use App\Services\TenantService;
use Illuminate\Foundation\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        protected TenantService $tenants,
        protected AuditService $audit,
    ) {}

    /**
     * List customers for the user's accessible outlets.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $company = $this->tenants->resolveForUser($user);

        abort_unless($company !== null, 403, 'Anda belum memiliki tenant aktif.');

        $outletIds = $this->accessibleOutletIds($user);

        $customers = Customer::query()
            ->with('outlet:id,nama_outlet')
            ->where('company_id', $company->id)
            ->when($outletIds->isNotEmpty(), fn ($query) => $query->whereIn('outlet_id', $outletIds))
            ->when($request->filled('search'), fn ($query) => $query->where(fn ($q) => $q
                ->where('name', 'like', '%'.$request->input('search').'%')
                ->orWhere('email', 'like', '%'.$request->input('search').'%')
                ->orWhere('phone', 'like', '%'.$request->input('search').'%')))
            ->orderByDesc('points')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('akun_users/customers', [
            'customers' => $customers,
            'outlets' => $user->outlets()->orderBy('outlets.nama_outlet')->get(['outlets.id', 'outlets.nama_outlet']),
            'selectedOutletId' => (int) $request->session()->get('selected_outlet_id', 0),
        ]);
    }

    /**
     * Store a new customer.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $company = $this->tenants->resolveForUser($user);

        abort_unless($company !== null, 403, 'Anda belum memiliki tenant aktif.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers', 'email')->where(fn ($q) => $q->where('company_id', $company->id))],
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'outlet_id' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        abort_if($this->outletIsNotInCompany($validated['outlet_id'] ?? null, $company->id), 422, 'Outlet tidak valid untuk tenant Anda.');

        $customer = Customer::create([
            'company_id' => $company->id,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->audit->record(
            $customer,
            AuditLog::EVENT_CREATED,
            "Menambah pelanggan \"{$customer->name}\"",
            new: ['name' => $customer->name, 'email' => $customer->email],
        );

        return redirect()->back()->with('success', "Pelanggan \"{$customer->name}\" berhasil ditambahkan.");
    }

    /**
     * Update an existing customer.
     */
    public function update(Request $request, Customer $customer)
    {
        $company = $this->tenants->resolveForUser($request->user());
        abort_unless($company !== null && $customer->company_id === $company->id, 403, 'Anda tidak memiliki akses ke pelanggan ini.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers', 'email')->where(fn ($q) => $q->where('company_id', $company->id))->ignore($customer->id)],
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'outlet_id' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        abort_if($this->outletIsNotInCompany($validated['outlet_id'] ?? null, $company->id), 422, 'Outlet tidak valid untuk tenant Anda.');

        $customer->update($validated);

        $this->audit->record(
            $customer,
            AuditLog::EVENT_UPDATED,
            "Memperbarui pelanggan \"{$customer->name}\"",
            new: $validated,
        );

        return redirect()->back()->with('success', 'Pelanggan berhasil diperbarui.');
    }

    /**
     * Remove a customer (soft delete).
     */
    public function destroy(Request $request, Customer $customer)
    {
        $company = $this->tenants->resolveForUser($request->user());
        abort_unless($company !== null && $customer->company_id === $company->id, 403, 'Anda tidak memiliki akses ke pelanggan ini.');

        $name = $customer->name;
        $customer->delete();

        $this->audit->record(
            $customer,
            AuditLog::EVENT_DELETED,
            "Menghapus pelanggan \"{$name}\"",
        );

        return redirect()->back()->with('success', 'Pelanggan berhasil dihapus.');
    }

    /**
     * The ids of the outlets the user can manage as owner/admin.
     *
     * @return Collection<int, int>
     */
    private function accessibleOutletIds(User $user)
    {
        $roles = Role::whereIn('role', ['owner outlet', 'admin outlet', 'kasir'])->pluck('id');

        return $user->outlets()
            ->wherePivotIn('role_id', $roles)
            ->pluck('outlets.id');
    }

    private function outletIsNotInCompany(?int $outletId, int $companyId): bool
    {
        if ($outletId === null) {
            return false;
        }

        return ! Outlet::query()
            ->where('id', $outletId)
            ->where('company_id', $companyId)
            ->exists();
    }
}
