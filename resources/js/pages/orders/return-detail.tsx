import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Package,
    RotateCcw,
    ShoppingBag,
    XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ReturnItem {
    id: number;
    quantity: number;
    reason: string;
    order_item: {
        product_name: string;
        price: number;
        subtotal: number;
    };
    produk: {
        nama_produk: string;
    };
}

interface ReturnDetail {
    id: number;
    return_number: string;
    status: string;
    reason: string;
    refund_amount: number;
    notes: string | null;
    created_at: string;
    order: {
        id: number;
        order_number: string;
        total: number;
        status: string;
        user: {
            name: string;
            email: string;
        };
    };
    items: ReturnItem[];
}

interface ReturnDetailProps {
    return: ReturnDetail;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Retur', href: '/orders/returns' },
    { title: 'Detail Retur', href: '#' },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatTanggal = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const returnStatusLabel = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'Menunggu';
        case 'approved':
            return 'Disetujui';
        case 'rejected':
            return 'Ditolak';
        case 'completed':
            return 'Selesai';
        default:
            return status;
    }
};

const returnStatusBadgeClass = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'approved':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'rejected':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        case 'completed':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const returnStatusIcon = (status: string) => {
    switch (status) {
        case 'approved':
        case 'completed':
            return <CheckCircle className="h-4 w-4" />;
        case 'rejected':
            return <XCircle className="h-4 w-4" />;
        default:
            return <Clock className="h-4 w-4" />;
    }
};

const orderStatusLabel = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'Menunggu';
        case 'awaiting_payment':
            return 'Menunggu Pembayaran';
        case 'paid':
            return 'Dibayar';
        case 'processing':
            return 'Diproses';
        case 'shipped':
            return 'Dikirim';
        case 'completed':
            return 'Selesai';
        case 'cancelled':
            return 'Dibatalkan';
        case 'expired':
            return 'Kedaluwarsa';
        default:
            return status;
    }
};

export default function ReturnDetailPage({
    return: returnData,
}: Readonly<ReturnDetailProps>) {
    const { auth } = usePage().props as { auth?: { user?: { name: string } } };
    const isOwner = auth?.user && auth.user.name === returnData.order.user.name;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Retur ${returnData.return_number}`} />

            <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit('/orders')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Pesanan Saya
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                                <RotateCcw className="h-8 w-8 text-indigo-500" />
                                Detail Retur
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {returnData.return_number}
                            </p>
                        </div>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${returnStatusBadgeClass(returnData.status)}`}
                        >
                            {returnStatusIcon(returnData.status)}
                            {returnStatusLabel(returnData.status)}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Order Info Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            <ShoppingBag className="h-5 w-5 text-indigo-500" />
                            Informasi Pesanan
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nomor Pesanan
                                </p>
                                <Link
                                    href={`/orders/${returnData.order.id}`}
                                    className="mt-0.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {returnData.order.order_number}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Total Pesanan
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(returnData.order.total)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Status Pesanan
                                </p>
                                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                                    {orderStatusLabel(returnData.order.status)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            <Package className="h-5 w-5 text-indigo-500" />
                            Item yang Diretur
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Produk
                                        </th>
                                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Jumlah Diretur
                                        </th>
                                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Harga
                                        </th>
                                        <th className="px-4 py-2.5 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {returnData.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {item.produk?.nama_produk ||
                                                        item.order_item
                                                            .product_name}
                                                </p>
                                                {item.reason && (
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                        Alasan: {item.reason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatRupiah(
                                                    item.order_item.price,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(
                                                    item.order_item.subtotal,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Reason & Refund */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Alasan Retur
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {returnData.reason}
                            </p>
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Diajukan pada{' '}
                                    {formatTanggal(returnData.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Total Refund
                            </h2>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatRupiah(returnData.refund_amount)}
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    {returnData.notes && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Catatan
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {returnData.notes}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isOwner && (
                        <div className="flex flex-wrap items-center gap-3">
                            {returnData.status === 'pending' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                `/returns/${returnData.id}/approve`,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Setujui Retur
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                `/returns/${returnData.id}/reject`,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Tolak Retur
                                    </button>
                                </>
                            )}
                            {returnData.status === 'approved' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            `/returns/${returnData.id}/complete`,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Selesaikan Retur
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
