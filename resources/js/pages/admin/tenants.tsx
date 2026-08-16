import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Search, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
}

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
    plan: string;
    plan_slug: string | null;
    outlet_count: number;
    user_count: number;
    created_at: string;
}

interface TenantPagination {
    data: Tenant[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface TenantsProps {
    tenants: TenantPagination;
    plans: Plan[];
    filters: {
        search: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Pusat',
        href: admin.dashboard().url,
    },
    {
        title: 'Kelola Tenant',
        href: admin.tenants().url,
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

export default function Tenants({
    tenants,
    plans,
    filters,
}: Readonly<TenantsProps>) {
    const { flash } = usePage().props;

    const applyFilter = (data: { search?: string; status?: string }) => {
        router.get(
            admin.tenants().url,
            { ...filters, ...data },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        applyFilter({ search: String(form.get('search') ?? '') });
    };

    const toggleSuspend = (tenant: Tenant) => {
        router.post(
            tenant.status === 'suspended'
                ? admin.tenants.activate({ company: tenant.id }).url
                : admin.tenants.suspend({ company: tenant.id }).url,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Tenant" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <Building2 className="h-8 w-8 text-indigo-500" />
                            Kelola Tenant
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Seluruh tenant (perusahaan) yang terdaftar di
                            platform
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

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        onSubmit={handleSearch}
                        className="relative sm:max-w-xs"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            name="search"
                            defaultValue={filters.search}
                            placeholder="Cari nama tenant..."
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        {[
                            ['', 'Semua'],
                            ['active', 'Aktif'],
                            ['trial', 'Trial'],
                            ['suspended', 'Diblokir'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() =>
                                    applyFilter({ status: value ?? '' })
                                }
                                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                    filters.status === value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(tenants.total)} tenant
                        </span>
                    </div>

                    {tenants.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <Building2 className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada tenant ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                Coba ubah kata kunci pencarian atau filter
                                status.
                            </p>
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
                                            'Bergabung',
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
                                    {tenants.data.map((tenant) => (
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
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {tenant.slug}
                                                </p>
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
                                                {formatWaktu(tenant.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={admin.tenants.show(
                                                            {
                                                                company:
                                                                    tenant.id,
                                                            },
                                                        )}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        Detail
                                                    </Link>
                                                    {tenant.status ===
                                                    'suspended' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSuspend(
                                                                    tenant,
                                                                )
                                                            }
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                                                        >
                                                            Aktifkan
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleSuspend(
                                                                    tenant,
                                                                )
                                                            }
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                        >
                                                            Blokir
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

                    {tenants.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {tenants.links.map((link, index) => {
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

                {plans.length > 0 && (
                    <div className="mt-6 hidden rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            Paket yang tersedia
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {plans.map((plan) => (
                                <span
                                    key={plan.id}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                                    {plan.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
