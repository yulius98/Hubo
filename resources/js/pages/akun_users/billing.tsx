import { Head, router, usePage } from '@inertiajs/react';
import { CreditCard, FileText, Wallet } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { billing } from '@/routes';
import { pay as payRoute } from '@/routes/billing';
import type { BreadcrumbItem } from '@/types';

interface SubscriptionInfo {
    id: number;
    status: string;
    plan: string;
    plan_price: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
    ends_at: string | null;
}

interface InvoiceItem {
    id: number;
    invoice_number: string;
    amount: number;
    status: string;
    period_start: string | null;
    period_end: string | null;
    paid_at: string | null;
}

interface BillingPageProps {
    tenant: { id: number; name: string };
    subscription: SubscriptionInfo | null;
    invoices: InvoiceItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Billing Langganan', href: billing().url },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatWaktu = (value: string | null): string =>
    value
        ? new Date(value).toLocaleDateString('id-ID', {
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
    tenant,
    subscription,
    invoices,
}: Readonly<BillingPageProps>) {
    const { flash } = usePage().props;

    const payInvoice = (invoiceId: number) => {
        router.post(
            payRoute().url,
            { invoice_id: invoiceId },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing Langganan" />

            <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <CreditCard className="h-8 w-8 text-indigo-500" />
                        Billing Langganan
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Informasi tagihan {tenant.name}
                    </p>
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

                {subscription && (
                    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 dark:border-gray-700">
                            <p className="text-xs font-medium tracking-wide text-indigo-100 uppercase">
                                Paket aktif
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-white">
                                {subscription.plan}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Harga per bulan
                                </p>
                                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(subscription.plan_price)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Masa trial berakhir
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatWaktu(subscription.trial_ends_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Periode aktif hingga
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {formatWaktu(
                                        subscription.current_period_end,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Wallet className="h-4 w-4" />
                            Riwayat invoice
                        </span>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <FileText className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Belum ada invoice
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        {[
                                            'No. Invoice',
                                            'Jumlah',
                                            'Periode',
                                            'Status',
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
                                    {invoices.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {invoice.invoice_number}
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
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {invoice.status ===
                                                    'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            payInvoice(
                                                                invoice.id,
                                                            )
                                                        }
                                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                                    >
                                                        Bayar
                                                    </button>
                                                )}
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
