import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Package, Plus, Trash2, Truck, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PurchaseOrderItem {
    id: number;
    jumlah: number;
    harga_beli: number;
    subtotal: number;
    produk: { id: number; nama_produk: string } | null;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: string;
    total: number;
    expected_date: string | null;
    received_date: string | null;
    catatan: string | null;
    created_at: string;
    supplier: { id: number; nama: string } | null;
    items: PurchaseOrderItem[];
}

interface PurchaseOrderPagination {
    data: PurchaseOrder[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface SupplierOption {
    id: number;
    nama: string;
}

interface ProductOption {
    id: number;
    nama_produk: string;
    harga_beli: number;
    stok: number;
}

interface PurchaseOrdersProps {
    purchaseOrders: PurchaseOrderPagination;
    suppliers: SupplierOption[];
    products: ProductOption[];
    status: string;
}

interface FormItem {
    produk_id: number;
    jumlah: number;
    harga_beli: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Purchase Order',
        href: admin.purchaseOrders().url,
    },
];

const formatNumber = (value: number): string =>
    new Intl.NumberFormat('id-ID').format(value);

const formatWaktu = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const formatRupiah = (value: number): string =>
    `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;

const statusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        draft: 'Draft',
        submitted: 'Submitted',
        received: 'Received',
        cancelled: 'Dibatalkan',
    };
    return labels[status] ?? status;
};

const statusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
        draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        received: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const emptyForm = {
    supplier_id: '',
    expected_date: '',
    catatan: '',
};

const emptyItem: FormItem = {
    produk_id: 0,
    jumlah: 1,
    harga_beli: 0,
};

const inputClass =
    'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

const statusFilters = [
    { value: '', label: 'Semua' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export default function PurchaseOrders({ purchaseOrders, suppliers, products, status }: Readonly<PurchaseOrdersProps>) {
    const { flash } = usePage().props;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [items, setItems] = useState<FormItem[]>([{ ...emptyItem }]);
    const [processing, setProcessing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState<PurchaseOrder | null>(null);
    const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
    const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);

    const handleStatusFilter = (value: string) => {
        const params: Record<string, string> = {};
        if (value) {
            params.status = value;
        }
        router.get(
            admin.purchaseOrders().url,
            params,
            { preserveState: true, replace: true },
        );
    };

    const openCreate = () => {
        setForm(emptyForm);
        setItems([{ ...emptyItem }]);
        setDialogOpen(true);
    };

    const addItem = () => {
        setItems([...items, { ...emptyItem }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof FormItem, value: number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'produk_id') {
            const product = products.find((p) => p.id === value);
            if (product) {
                updated[index].harga_beli = product.harga_beli;
            }
        }
        setItems(updated);
    };

    const itemsTotal = items.reduce((sum, item) => sum + item.jumlah * item.harga_beli, 0);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            supplier_id: form.supplier_id,
            expected_date: form.expected_date || null,
            catatan: form.catatan || null,
            items: items.filter((item) => item.produk_id > 0 && item.jumlah > 0),
        };

        router.post(
            admin.purchaseOrders.store().url,
            payload,
            {
                onSuccess: () => {
                    setDialogOpen(false);
                    setForm(emptyForm);
                    setItems([{ ...emptyItem }]);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmDelete = (po: PurchaseOrder) => {
        setDeleting(po);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deleting) return;
        setProcessing(true);
        router.delete(
            admin.purchaseOrders.destroy({ purchaseOrder: deleting.id }).url,
            {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setDeleting(null);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmReceive = (po: PurchaseOrder) => {
        setReceiving(po);
        setReceiveDialogOpen(true);
    };

    const handleReceive = () => {
        if (!receiving) return;
        setProcessing(true);
        router.post(
            admin.purchaseOrders.receive({ purchaseOrder: receiving.id }).url,
            {},
            {
                onSuccess: () => {
                    setReceiveDialogOpen(false);
                    setReceiving(null);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Order" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <Truck className="h-8 w-8 text-indigo-500" />
                            Purchase Order
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Kelola pembelian bahan dari supplier
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Buat PO
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6 flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => handleStatusFilter(filter.value)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                status === filter.value || (!status && filter.value === '')
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(purchaseOrders.total)} purchase order
                        </span>
                    </div>

                    {purchaseOrders.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <Truck className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada purchase order ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Buat purchase order baru untuk memulai.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'No. PO',
                                            'Supplier',
                                            'Items',
                                            'Total',
                                            'Status',
                                            'Tanggal Diharapkan',
                                            'Aksi',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                scope="col"
                                                className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {purchaseOrders.data.map((po) => (
                                        <tr
                                            key={po.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={admin.purchaseOrders.show({ purchaseOrder: po.id }).url}
                                                    className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                                >
                                                    {po.po_number}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {po.supplier?.nama ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {po.items.length} item
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                                                {formatRupiah(po.total)}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(po.status)}`}>
                                                    {statusLabel(po.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {po.expected_date ? formatWaktu(po.expected_date) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={admin.purchaseOrders.show({ purchaseOrder: po.id }).url}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        <Eye className="inline h-3.5 w-3.5 mr-1" />
                                                        Detail
                                                    </Link>
                                                    {po.status === 'submitted' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmReceive(po)}
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                                                        >
                                                            <Package className="inline h-3.5 w-3.5 mr-1" />
                                                            Terima
                                                        </button>
                                                    )}
                                                    {po.status === 'draft' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(po)}
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                        >
                                                            <Trash2 className="inline h-3.5 w-3.5 mr-1" />
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {purchaseOrders.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {purchaseOrders.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span
                                            key={index}
                                            className="cursor-not-allowed rounded-lg px-2.5 py-1 text-sm text-gray-400 dark:text-gray-600"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`rounded-lg px-2.5 py-1 text-sm font-medium transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Buat Purchase Order
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Isi formulir berikut untuk membuat purchase order baru.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="supplier_id" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Supplier <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="supplier_id"
                                required
                                value={form.supplier_id}
                                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Pilih supplier</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.nama}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Item <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <select
                                                required
                                                value={item.produk_id}
                                                onChange={(e) => updateItem(index, 'produk_id', Number(e.target.value))}
                                                className={inputClass}
                                            >
                                                <option value={0}>Pilih produk</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.nama_produk} (Stok: {product.stok})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                min={1}
                                                required
                                                value={item.jumlah}
                                                onChange={(e) => updateItem(index, 'jumlah', Number(e.target.value))}
                                                className={inputClass}
                                                placeholder="Qty"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <input
                                                type="number"
                                                min={0}
                                                required
                                                value={item.harga_beli}
                                                onChange={(e) => updateItem(index, 'harga_beli', Number(e.target.value))}
                                                className={inputClass}
                                                placeholder="Harga"
                                            />
                                        </div>
                                        <div className="w-32 text-right text-sm font-medium leading-10 text-gray-700 dark:text-gray-300">
                                            {formatRupiah(item.jumlah * item.harga_beli)}
                                        </div>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="mt-2 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Total: {formatRupiah(itemsTotal)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="expected_date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tanggal Diharapkan
                            </label>
                            <input
                                id="expected_date"
                                type="date"
                                value={form.expected_date}
                                onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="catatan" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Catatan
                            </label>
                            <textarea
                                id="catatan"
                                rows={3}
                                value={form.catatan}
                                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                                className={`${inputClass} py-2.5`}
                                placeholder="Catatan tambahan"
                            />
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => setDialogOpen(false)}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Buat PO'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Hapus Purchase Order
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Apakah Anda yakin ingin menghapus{' '}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {deleting?.po_number}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={processing}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                            {processing ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Terima Purchase Order
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Konfirmasi penerimaan untuk{' '}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {receiving?.po_number}
                            </span>
                            ? Stok akan bertambah sesuai item yang diterima.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setReceiveDialogOpen(false)}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleReceive}
                            disabled={processing}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {processing ? 'Memproses...' : 'Konfirmasi Terima'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
