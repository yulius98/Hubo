import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Package,
    ShieldCheck,
    Store,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    status: string;
    trial_ends_at: string | null;
    created_at: string;
    outlet_count: number;
    product_count: number;
    staff_count: number;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
}

interface Subscription {
    id: number;
    plan_id: number;
    status: string;
    starts_at: string;
    trial_ends_at: string | null;
    ends_at: string | null;
    canceled_at: string | null;
    plan: Plan | null;
}

interface Outlet {
    id: number;
    nama_outlet: string;
    kota: string;
    created_at: string;
}

interface Staff {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
}

interface TenantDetailProps {
    tenant: Tenant;
    subscription: Subscription | null;
    outlets: Outlet[];
    staff: Staff[];
    plans: Plan[];
}

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

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

function DetailCard({
    title,
    value,
    icon: Icon,
    iconClass,
}: Readonly<{
    title: string;
    value: string;
    icon: typeof Store;
    iconClass: string;
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
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function TenantDetail({
    tenant,
    subscription,
    outlets,
    staff,
    plans,
}: Readonly<TenantDetailProps>) {
    const { flash } = usePage().props;

    const handlePlanChange = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.put(
            admin.tenants.changePlan({ company: tenant.id }).url,
            { plan_id: Number(form.get('plan_id')) },
            { preserveScroll: true },
        );
    };

    const toggleSuspend = () => {
        router.post(
            tenant.status === 'suspended'
                ? admin.tenants.activate({ company: tenant.id }).url
                : admin.tenants.suspend({ company: tenant.id }).url,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Admin Pusat',
                    href: admin.dashboard().url,
                },
                {
                    title: 'Kelola Tenant',
                    href: admin.tenants().url,
                },
                {
                    title: tenant.name,
                    href: admin.tenants.show({ company: tenant.id }).url,
                },
            ]}
        >
            <Head title={tenant.name} />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <Link
                    href={admin.tenants()}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke daftar tenant
                </Link>

                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <Building2 className="h-8 w-8 text-indigo-500" />
                            {tenant.name}
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(tenant.status)}`}
                            >
                                {statusLabel(tenant.status)}
                            </span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {tenant.slug} · Bergabung{' '}
                            {formatWaktu(tenant.created_at)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={toggleSuspend}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
                            tenant.status === 'suspended'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        {tenant.status === 'suspended'
                            ? 'Aktifkan Kembali'
                            : 'Blokir Tenant'}
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailCard
                        title="Outlet"
                        value={formatNumber(tenant.outlet_count)}
                        icon={Store}
                        iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    />
                    <DetailCard
                        title="Produk"
                        value={formatNumber(tenant.product_count)}
                        icon={Package}
                        iconClass="bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                    />
                    <DetailCard
                        title="Staf"
                        value={formatNumber(tenant.staff_count)}
                        icon={Users}
                        iconClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
                    />
                    <DetailCard
                        title="Paket"
                        value={subscription?.plan?.name ?? '—'}
                        icon={Building2}
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Langganan
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
                        <div className="space-y-3 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Status langganan
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {subscription?.status ?? '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Biaya bulanan
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatRupiah(
                                        subscription?.plan?.price_monthly ?? 0,
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Trial berakhir
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {subscription?.trial_ends_at
                                        ? formatWaktu(
                                              subscription.trial_ends_at,
                                          )
                                        : '—'}
                                </span>
                            </div>
                        </div>

                        <form
                            onSubmit={handlePlanChange}
                            className="lg:col-span-2"
                        >
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Ganti paket
                            </label>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <select
                                    name="plan_id"
                                    defaultValue={subscription?.plan_id ?? ''}
                                    className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} ·{' '}
                                            {formatRupiah(plan.price_monthly)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                Daftar Outlet
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {outlets.length} outlet
                            </span>
                        </div>

                        {outlets.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada outlet pada tenant ini.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {outlets.map((outlet) => (
                                    <div
                                        key={outlet.id}
                                        className="flex items-center justify-between gap-3 px-5 py-3.5"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {outlet.nama_outlet}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {outlet.kota} ·{' '}
                                                {formatWaktu(outlet.created_at)}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                            #{outlet.id}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                Pengguna
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {staff.length} orang
                            </span>
                        </div>

                        {staff.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada pengguna pada tenant ini.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {staff.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 px-5 py-3.5"
                                    >
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-9 w-9 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
