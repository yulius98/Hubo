import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Download,
    DollarSign,
    TrendingUp,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface MonthlyRow {
    month: string;
    revenue: number;
    cogs: number;
    expenses: number;
    profit: number;
}

interface Outlet {
    id: number;
    name: string;
}

interface ReportsProps {
    revenue: number;
    cogs: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    monthlyBreakdown: MonthlyRow[];
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
        title: 'Laporan Keuangan',
        href: admin.reports().url,
    },
];

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

function MetricCard({
    title,
    value,
    icon: Icon,
    iconBg,
    iconText,
}: Readonly<{
    title: string;
    value: string;
    icon: typeof DollarSign;
    iconBg: string;
    iconText: string;
}>) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                >
                    <Icon className={`h-5 w-5 ${iconText}`} />
                </div>
            </div>
        </div>
    );
}

export default function Reports({
    revenue,
    cogs,
    totalExpenses,
    grossProfit,
    netProfit,
    monthlyBreakdown,
    outlets,
    filters,
}: Readonly<ReportsProps>) {
    const { flash } = usePage().props;

    const applyFilter = (data: Record<string, string>) => {
        router.get(
            admin.reports().url,
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
        return `${admin.reports.export().url}?${params.toString()}`;
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
    const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <BarChart3 className="h-8 w-8 text-indigo-500" />
                            Laporan Keuangan
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Analisis laba/rugi
                        </p>
                    </div>

                    <a
                        href={exportUrl()}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </a>
                    <a
                        href={`${exportUrl()}&format=excel`.replace('/reports/export', '/reports/export-excel')}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                    >
                        <Download className="h-4 w-4" />
                        Excel
                    </a>
                    <a
                        href={`${exportUrl()}&format=pdf`.replace('/reports/export', '/reports/export-pdf')}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                    >
                        <Download className="h-4 w-4" />
                        PDF
                    </a>
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
                                value={filters.outlet_id}
                                onChange={(e) =>
                                    applyFilter({ outlet_id: e.target.value })
                                }
                                className={inputClass}
                            >
                                <option value="">Semua Outlet</option>
                                {outlets.map((outlet) => (
                                    <option
                                        key={outlet.id}
                                        value={String(outlet.id)}
                                    >
                                        {outlet.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Pendapatan"
                        value={formatRupiah(revenue)}
                        icon={TrendingUp}
                        iconBg="bg-emerald-50 dark:bg-emerald-900/40"
                        iconText="text-emerald-600 dark:text-emerald-400"
                    />
                    <MetricCard
                        title="Harga Pokok (COGS)"
                        value={formatRupiah(cogs)}
                        icon={ArrowDownRight}
                        iconBg="bg-red-50 dark:bg-red-900/40"
                        iconText="text-red-600 dark:text-red-400"
                    />
                    <MetricCard
                        title="Biaya Operasional"
                        value={formatRupiah(totalExpenses)}
                        icon={ArrowDownRight}
                        iconBg="bg-red-50 dark:bg-red-900/40"
                        iconText="text-red-600 dark:text-red-400"
                    />
                    <MetricCard
                        title="Laba Bersih"
                        value={formatRupiah(netProfit)}
                        icon={DollarSign}
                        iconBg="bg-blue-50 dark:bg-blue-900/40"
                        iconText="text-blue-600 dark:text-blue-400"
                    />
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Rincian Bulanan
                        </span>
                    </div>

                    {monthlyBreakdown.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <BarChart3 className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada data bulanan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Pilih rentang tanggal untuk melihat rincian.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Bulan',
                                            'Pendapatan',
                                            'COGS',
                                            'Biaya',
                                            'Laba',
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
                                    {monthlyBreakdown.map((row) => (
                                        <tr
                                            key={row.month}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {row.month}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                                                {formatRupiah(row.revenue)}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-red-600 dark:text-red-400">
                                                {formatRupiah(row.cogs)}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-red-600 dark:text-red-400">
                                                {formatRupiah(row.expenses)}
                                            </td>
                                            <td
                                                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap ${
                                                    row.profit >= 0
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {formatRupiah(row.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
