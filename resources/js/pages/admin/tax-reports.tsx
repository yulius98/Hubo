import { Head, router, usePage } from '@inertiajs/react';
import { Download, Percent, ReceiptText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface TaxMonthRow {
    month: string;
    order_count: number;
    taxable_total: number;
    tax_total: number;
    order_total: number;
}

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface TaxReportsProps {
    total_ppn: number;
    total_orders: number;
    months: TaxMonthRow[];
    outlets: Outlet[];
    filters: {
        start_date: string;
        end_date: string;
        outlet_id: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Laporan PPN',
        href: admin.reports.tax().url,
    },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatMonth = (month: string): string => {
    const [year, num] = month.split('-');
    const names = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    const index = Number(num) - 1;

    return `${names[index] ?? num} ${year}`;
};

export default function TaxReports({
    total_ppn,
    total_orders,
    months,
    outlets,
    filters,
}: Readonly<TaxReportsProps>) {
    const { flash } = usePage().props;

    const applyFilter = (data: Record<string, string>) => {
        router.get(
            admin.reports.tax().url,
            { ...filters, ...data },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const exportUrl = () => {
        const params = new URLSearchParams();
        if (filters.start_date) params.set('start_date', filters.start_date);
        if (filters.end_date) params.set('end_date', filters.end_date);
        if (filters.outlet_id) params.set('outlet_id', filters.outlet_id);
        return `${admin.reports.taxExport().url}?${params.toString()}`;
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan PPN" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <ReceiptText className="h-8 w-8 text-indigo-500" />
                            Laporan PPN
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Rekap PPN bulanan dari faktur penjualan
                        </p>
                    </div>

                    <a
                        href={exportUrl()}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Download className="h-4 w-4" />
                        Ekspor CSV
                    </a>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total PPN
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(total_ppn)}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40">
                                <Percent className="h-5 w-5 text-indigo-500" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Jumlah Faktur
                                </p>
                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {total_orders.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/40">
                                <ReceiptText className="h-5 w-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Dari Tanggal</label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) =>
                                    applyFilter({ start_date: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Sampai Tanggal</label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) =>
                                    applyFilter({ end_date: e.target.value })
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label className={labelClass}>Outlet</label>
                            <select
                                value={filters.outlet_id ?? ''}
                                onChange={(e) =>
                                    applyFilter({
                                        outlet_id: e.target.value,
                                    })
                                }
                                className={inputClass}
                            >
                                <option value="">Semua Outlet</option>
                                {outlets.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.nama_outlet}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/60">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        Bulan
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        Jumlah Faktur
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        Dasar Pengenaan Pajak
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        PPN
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {months.map((row) => (
                                    <tr
                                        key={row.month}
                                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {formatMonth(row.month)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums dark:text-gray-300">
                                            {row.order_count.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums dark:text-gray-300">
                                            {formatRupiah(row.taxable_total)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-600 tabular-nums dark:text-indigo-400">
                                            {formatRupiah(row.tax_total)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums dark:text-gray-300">
                                            {formatRupiah(row.order_total)}
                                        </td>
                                    </tr>
                                ))}
                                {months.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Belum ada data PPN pada periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}