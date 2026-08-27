<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
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

        $expenses = Expense::query()
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
        Expense::create([
            'company_id' => $request->user()->company_id ?? 1,
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
        $expense->update([
            'outlet_id' => $request->input('outlet_id'),
            'kategori' => $request->input('kategori'),
            'jumlah' => $request->input('jumlah'),
            'tanggal' => $request->input('tanggal'),
            'keterangan' => $request->input('keterangan'),
        ]);

        return redirect()->back()->with('success', 'Pengeluaran berhasil diperbarui.');
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Pengeluaran berhasil dihapus.');
    }
}
