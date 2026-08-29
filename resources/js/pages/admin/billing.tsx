import { Head, Link, router, usePage } from '@inertiajs/react';
import { CreditCard, FileText, PlayCircle, Search, Wallet } from 'lucide-react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

interface Invoice {
    id: number;
    invoice_number: string;
    amount: number;
    status: string;
    period_start: string | null;
    period_end: string | null;
    paid_at: string | null;
    company: string;
    plan: string;
}

interface Pagination {
    data: Invoice[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface BillingProps {
    invoices: Pagination;
    metrics: { pending: number; paid: number; revenue: number };
    filters: { period: string; status: string; search: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Pusat', href: admin.dashboard().url },
    { title: 'Billing Langganan', href: admin.billing().url },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatWaktu = (value: string | null): string =>
    value
        ? new Date(value).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

const statusBadge = (status: string): string => {
    switch (status) {
        case 'paid':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'pending':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const statusLabel = (status: string): string => {
    switch (status) {
        case 'paid':
            return 'Dibayar';
        case 'pending':
            return 'Menunggu';
        default:
            return 'Gagal';
    }
};

export default function Billing({
    invoices,
    metrics,
    filters,
}: Readonly<BillingProps>) {
    const { flash } = usePage().props;

    const applyFilter = (data: {
        period?: string;
        status?: string;
        search?: string;
    }) => {
        router.get(
            admin.billing().url,
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

    const processBilling = () => {
        router.post(admin.billing.process().url, {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing Langganan" />

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                            <CreditCard className="h-8 w-8 text-indigo-500" />
                            Billing Langganan
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Invoice, siklus billing, dan pemakaian seluruh
                            tenant
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={processBilling}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
                    >
                        <PlayCircle className="h-4 w-4" />
                        Proses Tagihan
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Invoice Menunggu
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {metrics.pending}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Dibayar
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {metrics.paid}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                                <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Total Revenue
                                </p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(metrics.revenue)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

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
                            placeholder="Cari nomor invoice / tenant..."
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        {[
                            ['', 'Semua'],
                            ['pending', 'Menunggu'],
                            ['paid', 'Dibayar'],
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
                            {invoices.total} invoice langganan
                        </span>
                    </div>

                    {invoices.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <FileText className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tidak ada invoice
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'No. Invoice',
                                            'Tenant',
                                            'Paket',
                                            'Jumlah',
                                            'Periode',
                                            'Status',
                                            'Dibayar',
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
                                    {invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.company}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.plan}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {formatRupiah(invoice.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatWaktu(
                                                    invoice.period_start,
                                                )}{' '}
                                                →{' '}
                                                {formatWaktu(
                                                    invoice.period_end,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(invoice.status)}`}
                                                >
                                                    {statusLabel(
                                                        invoice.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatWaktu(invoice.paid_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {invoices.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-1 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700">
                            {invoices.links.map((link, index) =>
                                link.url === null ? (
                                    <span
                                        key={index}
                                        className="cursor-not-allowed rounded-lg px-2.5 py-1 text-sm text-gray-400 dark:text-gray-600"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
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
                                ),
                            )}
                        </div>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
