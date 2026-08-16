import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Building2,
    IndianRupee,
    Package,
    ReceiptText,
    ShieldCheck,
    Store,
    Users,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface Metrics {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    totalOutlets: number;
    totalProducts: number;
    totalTransactions: number;
    mrr: number;
}

interface RecentTenant {
    id: number;
    name: string;
    slug: string;
    status: string;
    plan: string;
    plan_slug: string | null;
    outlet_count: number;
    user_count: number;
    created_at: string;
    total_revenue: number;
}

interface AdminDashboardProps {
    metrics: Metrics;
    recentTenants: RecentTenant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
];

const formatNumber = (value: number): string =>
    new Intl.NumberFormat('id-ID').format(value);

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatWaktu = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const statusBadgeClass = (status: string): string => {
    switch (status) {
        case 'active':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'trial':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'suspended':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const statusLabel = (status: string): string => {
    switch (status) {
        case 'active':
            return 'Aktif';
        case 'trial':
            return 'Trial';
        case 'suspended':
            return 'Diblokir';
        default:
            return '—';
    }
};

function MetricCard({
    title,
    value,
    icon: Icon,
    iconClass,
    hint,
}: Readonly<{
    title: string;
    value: string;
    icon: typeof Building2;
    iconClass: string;
    hint?: string;
}>) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {hint}
                        </p>
                    )}
                </div>
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard({
    metrics,
    recentTenants,
}: Readonly<AdminDashboardProps>) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Pusat" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            Admin Pusat
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500/90 via-blue-500/85 to-cyan-500/80 px-3 py-1 text-sm font-medium text-white shadow-sm">
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                Super Admin
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Ringkasan platform, seluruh tenant, dan pendapatan
                        </p>
                    </div>
                    <Link
                        href={admin.tenants()}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Building2 className="h-4 w-4" />
                        Kelola Tenant
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Tenant"
                        value={formatNumber(metrics.totalTenants)}
                        icon={Building2}
                        iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                        hint={`${formatNumber(metrics.activeTenants)} aktif`}
                    />
                    <MetricCard
                        title="Total Pengguna"
                        value={formatNumber(metrics.totalUsers)}
                        icon={Users}
                        iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
                    />
                    <MetricCard
                        title="Total Outlet"
                        value={formatNumber(metrics.totalOutlets)}
                        icon={Store}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    />
                    <MetricCard
                        title="MRR"
                        value={formatRupiah(metrics.mrr)}
                        icon={IndianRupee}
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        hint="Pendapatan bulanan berulang"
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MetricCard
                        title="Total Produk"
                        value={formatNumber(metrics.totalProducts)}
                        icon={Package}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                    />
                    <MetricCard
                        title="Total Transaksi"
                        value={formatNumber(metrics.totalTransactions)}
                        icon={ReceiptText}
                        iconClass="bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                    />
                    <MetricCard
                        title="Tenant Diblokir"
                        value={formatNumber(metrics.suspendedTenants)}
                        icon={ShieldCheck}
                        iconClass="bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                    />
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Tenant Terbaru
                        </h2>
                        <Link
                            href={admin.tenants()}
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            Lihat semua
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {recentTenants.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada tenant terdaftar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'Nama Tenant',
                                            'Paket',
                                            'Status',
                                            'Outlet',
                                            'Pengguna',
                                            'Pendapatan',
                                            'Bergabung',
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
                                    {recentTenants.map((tenant) => (
                                        <tr
                                            key={tenant.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={admin.tenants.show({
                                                        company: tenant.id,
                                                    })}
                                                    className="font-medium text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                                                >
                                                    {tenant.name}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {tenant.plan}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(tenant.status)}`}
                                                >
                                                    {statusLabel(tenant.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatNumber(
                                                    tenant.outlet_count,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatNumber(
                                                    tenant.user_count,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatRupiah(
                                                    tenant.total_revenue,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatWaktu(tenant.created_at)}
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
