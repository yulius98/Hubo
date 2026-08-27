import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Eye, RotateCcw } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface ReturnOrder {
    id: number;
    return_number: string;
    status: string;
    reason: string;
    refund_amount: number;
    created_at: string;
    order: {
        id: number;
        order_number: string;
        total: number;
        user: { name: string; email: string };
    };
    company: { name: string } | null;
}

interface ReturnPagination {
    data: ReturnOrder[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface AdminReturnsProps {
    returns: ReturnPagination;
    filters: {
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Retur',
        href: '/admin/returns',
    },
];

const STATUS_OPTIONS = [
    ['', 'Semua'],
    ['pending', 'Pending'],
    ['approved', 'Disetujui'],
    ['rejected', 'Ditolak'],
    ['completed', 'Selesai'],
] as const;

const STATUS_BADGE: Record<string, string> = {
    pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    approved:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    completed:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    completed: 'Selesai',
};

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatTanggal = (value: string): string =>
    new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function AdminReturns({
    returns,
    filters,
}: Readonly<AdminReturnsProps>) {
    const { flash } = usePage().props;

    const applyFilter = (status: string) => {
        router.get(
            '/admin/returns',
            { status },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Retur" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <RotateCcw className="h-8 w-8 text-indigo-500" />
                            Retur
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Kelola semua permintaan retur dari seluruh tenant
                        </p>
                    </div>
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

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => applyFilter(e.target.value)}
                                className={inputClass}
                            >
                                {STATUS_OPTIONS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {returns.total} retur
                        </span>
                    </div>

                    {returns.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <RotateCcw className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada permintaan retur ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Coba ubah filter untuk melihat data lainnya.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'No. Retur',
                                            'No. Pesanan',
                                            'Tenant',
                                            'Pengguna',
                                            'Alasan',
                                            'Refund',
                                            'Status',
                                            'Tanggal',
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
                                    {returns.data.map((returnOrder) => (
                                        <tr
                                            key={returnOrder.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {returnOrder.return_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {returnOrder.order.order_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {returnOrder.company?.name ??
                                                    '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {
                                                            returnOrder.order.user
                                                                .name
                                                        }
                                                    </span>
                                                    <span className="block text-xs text-gray-400 dark:text-gray-500">
                                                        {
                                                            returnOrder.order.user
                                                                .email
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="max-w-[200px] truncate px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {returnOrder.reason || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(
                                                    returnOrder.refund_amount,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[returnOrder.status] ?? STATUS_BADGE.pending}`}
                                                >
                                                    {STATUS_LABEL[returnOrder.status] ??
                                                        returnOrder.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTanggal(
                                                        returnOrder.created_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <Link
                                                    href={`/returns/${returnOrder.id}`}
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
                    )}

                    {returns.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {returns.links.map((link, index) => {
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
        </AppLayout>
    );
}
