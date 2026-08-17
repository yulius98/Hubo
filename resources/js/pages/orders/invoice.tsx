import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle,
    CreditCard,
    Download,
    FileText,
    Printer,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface InvoiceItem {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface InvoicePayment {
    payment_number: string;
    gateway: string;
    status: string;
    amount: number;
    paid_at: string | null;
}

interface InvoiceOrder {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    subtotal: number;
    shipping_cost: number;
    discount: number;
    tax: number;
    total: number;
    payment_method: string;
    shipping_address: string;
    notes: string | null;
    paid_at: string | null;
    created_at: string;
    items: InvoiceItem[];
    payment: InvoicePayment | null;
    user: { name: string; email: string };
    outlet: { nama_outlet: string };
}

interface InvoiceProps {
    order: InvoiceOrder;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Pesanan', href: '/orders' },
    { title: 'Invoice', href: '#' },
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
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const paymentMethodLabel = (method: string): string => {
    switch (method) {
        case 'bank_transfer':
            return 'Transfer Bank';
        case 'ewallet':
            return 'E-Wallet';
        case 'va':
            return 'Virtual Account';
        case 'card':
            return 'Kartu Kredit/Debit';
        case 'cod':
            return 'Bayar di Tempat';
        default:
            return method;
    }
};

export default function InvoicePage({ order }: Readonly<InvoiceProps>) {
    const { flash } = usePage().props;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${order.order_number}`} />

            <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex items-center justify-between print:hidden">
                    <button
                        type="button"
                        onClick={() => router.visit(`/orders/${order.id}`)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Pesanan
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak Invoice
                    </button>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300 print:hidden">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                                <FileText className="h-6 w-6 text-indigo-500" />
                                INVOICE
                            </h1>
                            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
                                {order.order_number}
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {order.outlet.nama_outlet}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTanggal(order.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Tagih Kepada
                            </h2>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {order.user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.user.email}
                            </p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {order.shipping_address}
                            </p>
                        </div>
                        <div>
                            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Rincian Pembayaran
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-gray-100">Metode: </span>
                                {paymentMethodLabel(order.payment_method)}
                            </p>
                            {order.payment && (
                                <>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Nomor Ref: </span>
                                        <span className="font-mono">{order.payment.payment_number}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Status: </span>
                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Dibayar
                                        </span>
                                    </p>
                                    {order.payment.paid_at && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">Tanggal Bayar: </span>
                                            {formatTanggal(order.payment.paid_at)}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Harga
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {item.product_name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                                            {formatRupiah(item.price)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {formatRupiah(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatRupiah(order.subtotal)}</span>
                            </div>
                            {order.shipping_cost > 0 && (
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Ongkir</span>
                                    <span>{formatRupiah(order.shipping_cost)}</span>
                                </div>
                            )}
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>PPN (11%)</span>
                                <span>{formatRupiah(order.tax)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                <span>Total</span>
                                <span>{formatRupiah(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Catatan
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                        <p>Invoice ini dibuat secara otomatis oleh sistem Hubo.</p>
                        <p className="mt-1">Terima kasih atas pembelian Anda!</p>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
