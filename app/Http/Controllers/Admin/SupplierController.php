<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplierRequest;
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

        $suppliers = Supplier::query()
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

    public function store(SupplierRequest $request): RedirectResponse
    {
        Supplier::create([
            'company_id' => $request->user()->company_id ?? 1,
            'nama' => $request->input('nama'),
            'kontak_person' => $request->input('kontak_person'),
            'email' => $request->input('email'),
            'telepon' => $request->input('telepon'),
            'alamat' => $request->input('alamat'),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update([
            'nama' => $request->input('nama'),
            'kontak_person' => $request->input('kontak_person'),
            'email' => $request->input('email'),
            'telepon' => $request->input('telepon'),
            'alamat' => $request->input('alamat'),
            'catatan' => $request->input('catatan'),
        ]);

        return redirect()->back()->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier berhasil dihapus.');
    }
}
