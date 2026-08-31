<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Outlet;
use App\Services\TenantService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function __construct(protected TenantService $tenants) {}

    /**
     * List coupons for the user's company.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $company = $this->tenants->resolveForUser($user);

        abort_unless($company !== null, 403, 'Anda belum memiliki tenant aktif.');

        $coupons = Coupon::query()
            ->with('outlet:id,nama_outlet')
            ->where('company_id', $company->id)
            ->when($request->filled('search'), fn ($query) => $query->where(fn ($q) => $q
                ->where('code', 'like', '%'.$request->input('search').'%')
                ->orWhere('name', 'like', '%'.$request->input('search').'%')))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('akun_users/coupons', [
            'coupons' => $coupons,
            'outlets' => $user->outlets()->orderBy('outlets.nama_outlet')->get(['outlets.id', 'outlets.nama_outlet']),
            'selectedOutletId' => (int) $request->session()->get('selected_outlet_id', 0),
        ]);
    }

    /**
     * Store a new coupon.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $company = $this->tenants->resolveForUser($user);

        abort_unless($company !== null, 403, 'Anda belum memiliki tenant aktif.');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('coupons', 'code')->where(fn ($q) => $q->where('company_id', $company->id))],
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'usage_limit' => 'nullable|integer|min:1',
            'outlet_id' => 'nullable|integer',
        ]);

        abort_if($this->outletIsNotInCompany($validated['outlet_id'] ?? null, $company->id), 422, 'Outlet tidak valid untuk tenant Anda.');

        $coupon = Coupon::create([
            'company_id' => $company->id,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'code' => mb_strtoupper($validated['code']),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_purchase' => $validated['min_purchase'],
            'max_discount' => $validated['max_discount'] ?? null,
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_to' => $validated['valid_to'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Kupon \"{$coupon->code}\" berhasil dibuat.");
    }

    /**
     * Update an existing coupon.
     */
    public function update(Request $request, Coupon $coupon)
    {
        $company = $this->tenants->resolveForUser($request->user());
        abort_unless($company !== null && $coupon->company_id === $company->id, 403, 'Anda tidak memiliki akses ke kupon ini.');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('coupons', 'code')->where(fn ($q) => $q->where('company_id', $company->id))->ignore($coupon->id)],
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'usage_limit' => 'nullable|integer|min:1',
            'outlet_id' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        abort_if($this->outletIsNotInCompany($validated['outlet_id'] ?? null, $company->id), 422, 'Outlet tidak valid untuk tenant Anda.');

        $coupon->update([
            'code' => mb_strtoupper($validated['code']),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_purchase' => $validated['min_purchase'],
            'max_discount' => $validated['max_discount'] ?? null,
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_to' => $validated['valid_to'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'outlet_id' => $validated['outlet_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'Kupon berhasil diperbarui.');
    }

    /**
     * Toggle the active state of a coupon.
     */
    public function toggle(Request $request, Coupon $coupon)
    {
        $company = $this->tenants->resolveForUser($request->user());
        abort_unless($company !== null && $coupon->company_id === $company->id, 403, 'Anda tidak memiliki akses ke kupon ini.');

        $coupon->update(['is_active' => ! $coupon->is_active]);

        return redirect()->back()->with('success', $coupon->is_active ? 'Kupon diaktifkan.' : 'Kupon dinonaktifkan.');
    }

    /**
     * Remove a coupon (soft delete).
     */
    public function destroy(Request $request, Coupon $coupon)
    {
        $company = $this->tenants->resolveForUser($request->user());
        abort_unless($company !== null && $coupon->company_id === $company->id, 403, 'Anda tidak memiliki akses ke kupon ini.');

        $coupon->delete();

        return redirect()->back()->with('success', 'Kupon berhasil dihapus.');
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
