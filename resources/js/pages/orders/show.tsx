import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    CreditCard,
    FileText,
    Package,
    Truck,
    XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface OrderItem {
    id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    gambar: string | null;
}

interface Payment {
    payment_number: string;
    gateway: string;
    status: string;
    amount: number;
    paid_at: string | null;
}

interface OrderDetail {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    status_color: string;
    subtotal: number;
    shipping_cost: number;
    discount: number;
    tax: number;
    total: number;
    payment_method: string;
    shipping_address: string;
    notes: string | null;
    paid_at: string | null;
    completed_at: string | null;
    created_at: string;
    items: OrderItem[];
    payment: Payment | null;
}

interface OrderShowProps {
    order: OrderDetail;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Pesanan', href: '/orders' },
    { title: 'Detail Pesanan', href: '#' },
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

const statusBadgeClass = (color: string): string => {
    switch (color) {
        case 'emerald':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'blue':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
        case 'indigo':
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
        case 'purple':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
        case 'amber':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'red':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
};

const statusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-5 w-5 text-emerald-500" />;
        case 'processing':
        case 'shipped':
            return <Truck className="h-5 w-5 text-blue-500" />;
        case 'paid':
            return <CreditCard className="h-5 w-5 text-indigo-500" />;
        case 'cancelled':
        case 'expired':
            return <XCircle className="h-5 w-5 text-red-500" />;
        default:
            return <Clock className="h-5 w-5 text-amber-500" />;
    }
};

const statusSteps = [
    { key: 'pending', label: 'Dibuat' },
    { key: 'awaiting_payment', label: 'Menunggu Pembayaran' },
    { key: 'paid', label: 'Dibayar' },
    { key: 'processing', label: 'Diproses' },
    { key: 'shipped', label: 'Dikirim' },
    { key: 'completed', label: 'Selesai' },
];

const getStepIndex = (status: string): number => {
    const idx = statusSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
};

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

export default function OrderShow({ order }: Readonly<OrderShowProps>) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string; payment_url?: string } };
    const currentStep = getStepIndex(order.status);
    const isCancelled = ['cancelled', 'expired'].includes(order.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pesanan ${order.order_number}`} />

            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit('/orders')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Riwayat Pesanan
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                                <FileText className="h-8 w-8 text-indigo-500" />
                                {order.order_number}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Dibuat pada {formatTanggal(order.created_at)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/orders/${order.id}/invoice`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Invoice
                            </Link>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status_color)}`}
                            >
                                {statusIcon(order.status)}
                                {order.status_label}
                            </span>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.payment_url && (
                    <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm dark:border-indigo-800/60 dark:bg-indigo-900/20">
                        <p className="mb-3 text-sm font-medium text-indigo-800 dark:text-indigo-300">
                            Silakan selesaikan pembayaran Anda.
                        </p>
                        <a
                            href={flash.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <CreditCard className="h-4 w-4" />
                            Bayar Sekarang
                        </a>
                    </div>
                )}

                {!isCancelled && (
                    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Status Pesanan
                        </h2>
                        <div className="flex items-center justify-between">
                            {statusSteps.map((step, idx) => {
                                const isActive = idx === currentStep;
                                const isCompleted = idx < currentStep;

                                return (
                                    <div key={step.key} className="flex flex-1 items-center">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                                                    isCompleted
                                                        ? 'bg-emerald-500 text-white'
                                                        : isActive
                                                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50'
                                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="h-4 w-4" />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                            <p
                                                className={`mt-1.5 hidden text-center text-[10px] font-medium sm:block ${
                                                    isActive || isCompleted
                                                        ? 'text-gray-800 dark:text-gray-200'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < statusSteps.length - 1 && (
                                            <div
                                                className={`mx-1 h-0.5 flex-1 transition ${
                                                    idx < currentStep
                                                        ? 'bg-emerald-500'
                                                        : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                <Package className="h-5 w-5 text-indigo-500" />
                                Item Pesanan
                            </h2>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                                            {item.gambar ? (
                                                <img
                                                    src={item.gambar}
                                                    alt={item.product_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Package className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatRupiah(item.price)} x {item.quantity}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {formatRupiah(item.subtotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.notes && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Catatan
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {order.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Ringkasan
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(order.subtotal)}</span>
                                </div>
                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Ongkir</span>
                                        <span>{formatRupiah(order.shipping_cost)}</span>
                                    </div>
                                )}
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>Diskon</span>
                                        <span>-{formatRupiah(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>PPN (11%)</span>
                                    <span>{formatRupiah(order.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                    <span>Total</span>
                                    <span>{formatRupiah(order.total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Pengiriman
                            </h2>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Metode Pembayaran
                                    </p>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        {paymentMethodLabel(order.payment_method)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Alamat Pengiriman
                                    </p>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        {order.shipping_address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {order.payment && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    <CreditCard className="h-4 w-4 text-indigo-500" />
                                    Pembayaran
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nomor</p>
                                        <p className="font-mono text-gray-900 dark:text-gray-100">
                                            {order.payment.payment_number}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Gateway</p>
                                        <p className="text-gray-900 dark:text-gray-100">
                                            {order.payment.gateway}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            {order.payment.status}
                                        </span>
                                    </div>
                                    {order.payment.paid_at && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Dibayar pada
                                            </p>
                                            <p className="text-gray-900 dark:text-gray-100">
                                                {formatTanggal(order.payment.paid_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
