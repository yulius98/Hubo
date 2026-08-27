<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseOrderRequest;
use App\Models\Produk;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Transaksi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $status = (string) $request->query('status', '');

        $purchaseOrders = PurchaseOrder::query()
            ->with(['supplier:id,nama', 'items.produk:id,nama_produk'])
            ->when(in_array($status, ['draft', 'submitted', 'received', 'cancelled'], true), fn ($query) => $query
                ->where('status', $status))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $suppliers = Supplier::all(['id', 'nama']);
        $products = Produk::select('id', 'nama_produk', 'harga_beli', 'stok')->get();

        return Inertia::render('admin/purchase-orders', [
            'purchaseOrders' => $purchaseOrders,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load([
            'supplier',
            'items.produk',
            'outlet',
        ]);

        return Inertia::render('admin/purchase-order-detail', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function store(PurchaseOrderRequest $request): RedirectResponse
    {
        $po = DB::transaction(function () use ($request) {
            $total = collect($request->input('items'))->sum(
                fn (array $item) => $item['jumlah'] * $item['harga_beli']
            );

            $purchaseOrder = PurchaseOrder::create([
                'company_id' => $request->user()->company_id ?? 1,
                'outlet_id' => $request->input('outlet_id'),
                'supplier_id' => $request->input('supplier_id'),
                'po_number' => PurchaseOrder::generatePoNumber(),
                'status' => 'draft',
                'expected_date' => $request->input('expected_date'),
                'total' => $total,
                'catatan' => $request->input('catatan'),
            ]);

            foreach ($request->input('items') as $item) {
                $subtotal = $item['jumlah'] * $item['harga_beli'];

                $purchaseOrder->items()->create([
                    'produk_id' => $item['produk_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_beli' => $item['harga_beli'],
                    'subtotal' => $subtotal,
                ]);
            }

            return $purchaseOrder;
        });

        return redirect()->route('admin.purchase-orders.show', $po)
            ->with('success', 'Purchase order berhasil dibuat.');
    }

    public function update(PurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        abort_if($purchaseOrder->status !== 'draft', 403, 'Hanya PO dengan status draft yang dapat diedit.');

        DB::transaction(function () use ($request, $purchaseOrder) {
            $total = collect($request->input('items'))->sum(
                fn (array $item) => $item['jumlah'] * $item['harga_beli']
            );

            $purchaseOrder->update([
                'supplier_id' => $request->input('supplier_id'),
                'outlet_id' => $request->input('outlet_id'),
                'expected_date' => $request->input('expected_date'),
                'total' => $total,
                'catatan' => $request->input('catatan'),
            ]);

            $purchaseOrder->items()->delete();

            foreach ($request->input('items') as $item) {
                $subtotal = $item['jumlah'] * $item['harga_beli'];

                $purchaseOrder->items()->create([
                    'produk_id' => $item['produk_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_beli' => $item['harga_beli'],
                    'subtotal' => $subtotal,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Purchase order berhasil diperbarui.');
    }

    public function receive(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        abort_if(
            ! in_array($purchaseOrder->status, ['draft', 'submitted'], true),
            403,
            'Hanya PO dengan status draft atau submitted yang dapat diterima.'
        );

        DB::transaction(function () use ($purchaseOrder) {
            $purchaseOrder->load('items.produk');

            foreach ($purchaseOrder->items as $item) {
                Transaksi::create([
                    'tgl_transaksi' => now(),
                    'id_user' => auth()->id(),
                    'id_outlet' => $purchaseOrder->outlet_id,
                    'id_kategori' => $item->produk->id_kategori ?? 1,
                    'id_produk' => $item->produk_id,
                    'jenis_transaksi' => 'IN',
                    'jumlah_produk' => $item->jumlah,
                    'keterangan' => "PO #{$purchaseOrder->po_number}",
                    'harga_beli' => $item->harga_beli,
                    'harga_jual' => $item->produk->harga ?? 0,
                ]);

                Produk::where('id', $item->produk_id)
                    ->increment('stok', $item->jumlah);
            }

            $purchaseOrder->update([
                'status' => 'received',
                'received_date' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Purchase order berhasil diterima. Stok telah diperbarui.');
    }

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        abort_if($purchaseOrder->status !== 'draft', 403, 'Hanya PO dengan status draft yang dapat dihapus.');

        $purchaseOrder->delete();

        return redirect()->back()->with('success', 'Purchase order berhasil dihapus.');
    }
}
