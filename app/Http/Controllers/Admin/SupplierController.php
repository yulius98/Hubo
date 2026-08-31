<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $companyId = $request->user()->company_id;

        $suppliers = Supplier::query()
            ->when($companyId !== null, fn ($query) => $query->where('company_id', $companyId))
            ->when($search !== '', fn ($query) => $query
                ->where('nama', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/suppliers', [
            'suppliers' => $suppliers,
            'search' => $search,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = $this->resolveCompanyId($request);

        abort_unless($companyId !== null, 422, 'Supplier memerlukan akun yang terhubung ke company.');

        $validated = $this->validated($request);

        Supplier::create([
            'company_id' => $companyId,
            ...$validated,
        ]);

        return redirect()->back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        abort_unless($this->belongsToAccessibleCompany($request, $supplier), 403, 'Anda tidak memiliki akses ke supplier ini.');

        $supplier->update($this->validated($request));

        return redirect()->back()->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(Request $request, Supplier $supplier): RedirectResponse
    {
        abort_unless($this->belongsToAccessibleCompany($request, $supplier), 403, 'Anda tidak memiliki akses ke supplier ini.');

        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'kontak_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'alamat' => ['nullable', 'string', 'max:1000'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    private function resolveCompanyId(Request $request): ?int
    {
        return $request->user()->company_id;
    }

    private function belongsToAccessibleCompany(Request $request, Supplier $supplier): bool
    {
        if ($request->user()->isSuperAdmin()) {
            return $supplier->company_id !== null;
        }

        return $request->user()->company_id !== null && (int) $request->user()->company_id === (int) $supplier->company_id;
    }
}
