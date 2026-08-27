import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, FileText, Truck, StickyNote } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface PurchaseOrderItem {
    id: number;
    jumlah: number;
    harga_beli: number;
    subtotal: number;
    produk: { id: number; nama_produk: string; stok: number } | null;
}

interface PurchaseOrderDetail {
    id: number;
    po_number: string;
    status: string;
    total: number;
    expected_date: string | null;
    received_date: string | null;
    catatan: string | null;
    created_at: string;
    updated_at: string;
    supplier: {
        id: number;
        nama: string;
        kontak_person: string | null;
        email: string | null;
        telepon: string | null;
        alamat: string | null;
    } | null;
    outlet: {
        id: number;
        nama_outlet: string;
    } | null;
    items: PurchaseOrderItem[];
}

interface PurchaseOrderDetailProps {
    purchaseOrder: PurchaseOrderDetail;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Pusat', href: admin.dashboard().url },
    { title: 'Purchase Order', href: admin.purchaseOrders().url },
    { title: 'Detail', href: '#' },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatTanggal = (value: string | null): string => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const statusBadgeClass = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        case 'submitted':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'received':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'cancelled':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const statusLabel = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'Draft';
        case 'submitted':
            return 'Submitted';
        case 'received':
            return 'Diterima';
        case 'cancelled':
            return 'Dibatalkan';
        default:
            return status;
    }
};

export default function PurchaseOrderDetailPage({
    purchaseOrder,
}: Readonly<PurchaseOrderDetailProps>) {
    const handleReceive = () => {
        if (!window.confirm('Konimasi bahwa PO ini telah diterima?')) return;
        router.post(
            admin.purchaseOrders.receive({ purchaseOrder: purchaseOrder.id }).url,
            {},
            { preserveScroll: true },
        );
    };

    const subtotal = purchaseOrder.items.reduce(
        (sum, item) => sum + item.subtotal,
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`PO ${purchaseOrder.po_number}`} />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <Link
                    href={admin.purchaseOrders().url}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke daftar PO
                </Link>

                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <FileText className="h-8 w-8 text-indigo-500" />
                            {purchaseOrder.po_number}
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(purchaseOrder.status)}`}
                            >
                                {statusLabel(purchaseOrder.status)}
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Dibuat pada {formatTanggal(purchaseOrder.created_at)}
                            {purchaseOrder.outlet && (
                                <> · {purchaseOrder.outlet.nama_outlet}</>
                            )}
                        </p>
                    </div>

                    {(purchaseOrder.status === 'draft' ||
                        purchaseOrder.status === 'submitted') && (
                        <button
                            type="button"
                            onClick={handleReceive}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Terima PO
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                            Informasi Supplier
                        </h2>
                        {purchaseOrder.supplier ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {purchaseOrder.supplier.nama}
                                    </p>
                                </div>
                                {purchaseOrder.supplier.kontak_person && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Kontak Person
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {purchaseOrder.supplier.kontak_person}
                                        </span>
                                    </div>
                                )}
                                {purchaseOrder.supplier.email && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Email
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {purchaseOrder.supplier.email}
                                        </span>
                                    </div>
                                )}
                                {purchaseOrder.supplier.telepon && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Telepon
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {purchaseOrder.supplier.telepon}
                                        </span>
                                    </div>
                                )}
                                {purchaseOrder.supplier.alamat && (
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Alamat
                                        </span>
                                        <span className="text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {purchaseOrder.supplier.alamat}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tidak ada data supplier.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
                            Ringkasan
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Status
                                </span>
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(purchaseOrder.status)}`}
                                >
                                    {statusLabel(purchaseOrder.status)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Tanggal Diharapkan
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatTanggal(purchaseOrder.expected_date)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Tanggal Diterima
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatTanggal(purchaseOrder.received_date)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Outlet
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {purchaseOrder.outlet?.nama_outlet ?? '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Item
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {purchaseOrder.items.length} produk
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Subtotal
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {formatRupiah(subtotal)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Total
                                </span>
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(purchaseOrder.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {purchaseOrder.catatan && (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-800/60 dark:bg-amber-900/10">
                        <div className="flex items-start gap-3">
                            <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h2 className="text-base font-semibold text-amber-800 dark:text-amber-200">
                                    Catatan
                                </h2>
                                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                    {purchaseOrder.catatan}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Item Pembelian
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        #
                                    </th>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Produk
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Stok
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Jumlah
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Harga Beli
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {purchaseOrder.items.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="transition hover:bg-gray-50 dark:hover:bg-gray-900/30"
                                    >
                                        <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.produk?.nama_produk ?? '—'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-sm text-gray-600 dark:text-gray-300">
                                            {item.produk?.stok ?? '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.jumlah}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-sm text-gray-600 dark:text-gray-300">
                                            {formatRupiah(item.harga_beli)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {formatRupiah(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                                    <td
                                        colSpan={5}
                                        className="px-5 py-3.5 text-right text-sm font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                        Total
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {formatRupiah(purchaseOrder.total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {purchaseOrder.items.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada item pada PO ini.
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
