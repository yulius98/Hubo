<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProdukVariantController extends Controller
{
    /**
     * List active variants of a product.
     */
    public function index(Request $request, Produk $produk)
    {
        $this->authorize('update', $produk);

        return response()->json([
            'variants' => $produk->variants()->orderBy('id')->get(),
            'product_stock' => $produk->effectiveStock(),
        ]);
    }

    /**
     * Store a new variant for the product.
     */
    public function store(Request $request, Produk $produk)
    {
        $this->authorize('update', $produk);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('product_variants', 'sku')->where(fn ($query) => $query->whereNotNull('sku'))],
            'harga' => 'nullable|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $variant = $produk->variants()->create([
            'nama' => $validated['nama'],
            'sku' => $validated['sku'] ?? null,
            'harga' => $validated['harga'] ?? null,
            'stok' => (int) $validated['stok'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', "Varian \"{$variant->nama}\" berhasil ditambahkan.");
    }

    /**
     * Update an existing variant.
     */
    public function update(Request $request, Produk $produk, ProductVariant $variant)
    {
        abort_if($variant->produk_id !== $produk->id, 404);
        $this->authorize('update', $produk);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('product_variants', 'sku')->where(fn ($query) => $query->whereNotNull('sku'))->ignore($variant->id)],
            'harga' => 'nullable|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $variant->update([
            'nama' => $validated['nama'],
            'sku' => $validated['sku'] ?? null,
            'harga' => $validated['harga'] ?? null,
            'stok' => (int) $validated['stok'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->back()->with('success', 'Varian berhasil diperbarui.');
    }

    /**
     * Remove a variant (hard delete so product rows never point to ghosts).
     */
    public function destroy(Request $request, Produk $produk, ProductVariant $variant)
    {
        abort_if($variant->produk_id !== $produk->id, 404);
        $this->authorize('update', $produk);

        $variant->delete();

        return redirect()->back()->with('success', 'Varian berhasil dihapus.');
    }
}
