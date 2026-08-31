import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Clock, Eye, RotateCcw } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ReturnOrder {
    id: number;
    return_number: string;
    status: string;
    reason: string;
    refund_amount: number;
    created_at: string;
    order: {
        order_number: string;
        total: number;
    };
}

interface ReturnsProps {
    returns: ReturnOrder[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Retur', href: '/orders/returns' },
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

export default function OrderReturns({ returns }: Readonly<ReturnsProps>) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Retur" />

            <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit('/orders')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Pesanan Saya
                    </button>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <RotateCcw className="h-8 w-8 text-indigo-500" />
                        Riwayat Retur
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Daftar permintaan retur Anda
                    </p>
                </div>

                {returns.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <RotateCcw className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Belum ada permintaan retur
                        </p>
                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                            Permintaan retur Anda akan muncul di sini.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            No. Retur
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            No. Pesanan
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Alasan
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Jumlah Refund
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Tanggal
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {returns.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                                        >
                                            <td className="px-5 py-3 font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {item.return_number}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {item.order.order_number}
                                            </td>
                                            <td className="max-w-[200px] truncate px-5 py-3 text-gray-600 dark:text-gray-400">
                                                {item.reason}
                                            </td>
                                            <td className="px-5 py-3 font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(
                                                    item.refund_amount,
                                                )}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${returnStatusBadgeClass(item.status)}`}
                                                >
                                                    {returnStatusLabel(
                                                        item.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTanggal(
                                                        item.created_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <Link
                                                    href={`/returns/${item.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
