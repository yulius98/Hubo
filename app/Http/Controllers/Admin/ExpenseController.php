<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $kategori = (string) $request->query('kategori', '');
        $companyId = $this->resolveCompanyId($request);

        $expenses = Expense::query()
            ->when($companyId !== null, fn ($query) => $query->where('company_id', $companyId))
            ->when($startDate, fn ($query) => $query->where('tanggal', '>=', $startDate))
            ->when($endDate, fn ($query) => $query->where('tanggal', '<=', $endDate))
            ->when($kategori !== '', fn ($query) => $query->where('kategori', $kategori))
            ->latest('tanggal')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/expenses', [
            'expenses' => $expenses,
        ]);
    }

    public function store(ExpenseRequest $request): RedirectResponse
    {
        $companyId = $this->companyIdFromOutletOrUser($request);

        abort_unless($companyId !== null, 422, 'Pengeluaran memerlukan outlet atau company yang valid.');

        Expense::create([
            'company_id' => $companyId,
            'outlet_id' => $request->input('outlet_id'),
            'kategori' => $request->input('kategori'),
            'jumlah' => $request->input('jumlah'),
            'tanggal' => $request->input('tanggal'),
            'keterangan' => $request->input('keterangan'),
        ]);

        return redirect()->back()->with('success', 'Pengeluaran berhasil ditambahkan.');
    }

    public function update(ExpenseRequest $request, Expense $expense): RedirectResponse
    {
        abort_unless($this->belongsToAccessibleCompany($request, $expense), 403, 'Anda tidak memiliki akses ke pengeluaran ini.');

        $expense->update([
            'outlet_id' => $request->input('outlet_id'),
            'kategori' => $request->input('kategori'),
            'jumlah' => $request->input('jumlah'),
            'tanggal' => $request->input('tanggal'),
            'keterangan' => $request->input('keterangan'),
        ]);

        return redirect()->back()->with('success', 'Pengeluaran berhasil diperbarui.');
    }

    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        abort_unless($this->belongsToAccessibleCompany($request, $expense), 403, 'Anda tidak memiliki akses ke pengeluaran ini.');

        $expense->delete();

        return redirect()->back()->with('success', 'Pengeluaran berhasil dihapus.');
    }

    private function resolveCompanyId(Request $request): ?int
    {
        return $request->user()->company_id;
    }

    private function companyIdFromOutletOrUser(Request $request): ?int
    {
        $outletId = $request->input('outlet_id');

        if ($outletId) {
            $outlet = Outlet::query()->find($outletId);

            if ($outlet !== null && $this->canAccessCompany($request, $outlet->company_id)) {
                return $outlet->company_id;
            }

            return null;
        }

        return $this->resolveCompanyId($request);
    }

    private function belongsToAccessibleCompany(Request $request, Expense $expense): bool
    {
        return $this->canAccessCompany($request, $expense->company_id);
    }

    private function canAccessCompany(Request $request, ?int $companyId): bool
    {
        if ($request->user()->isSuperAdmin()) {
            return $companyId !== null;
        }

        return $request->user()->company_id !== null && (int) $request->user()->company_id === (int) $companyId;
    }
}
