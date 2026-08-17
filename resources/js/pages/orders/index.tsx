import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Clock, Eye, Package, ShoppingBag } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    status_color: string;
    total: number;
    created_at: string;
    items: OrderItem[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface OrdersProps {
    orders: {
        data: Order[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Pesanan', href: '/orders' },
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

export default function OrderIndex({ orders }: Readonly<OrdersProps>) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Pesanan" />

            <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit('/pesanan-saya')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </button>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <ShoppingBag className="h-8 w-8 text-indigo-500" />
                        Riwayat Pesanan
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {orders.total} pesanan ditemukan
                    </p>
                </div>

                {orders.data.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Belum ada pesanan
                        </p>
                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                            Mulai belanja untuk membuat pesanan pertama.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {order.order_number}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatTanggal(order.created_at)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(order.status_color)}`}
                                        >
                                            {order.status_label}
                                        </span>
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Detail
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700/50">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        {order.items.slice(0, 3).map((item) => (
                                            <span key={item.id}>
                                                {item.product_name} (x{item.quantity})
                                            </span>
                                        ))}
                                        {order.items.length > 3 && (
                                            <span className="text-gray-400">
                                                +{order.items.length - 3} lainnya
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {formatRupiah(order.total)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {orders.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-1">
                        {orders.links.map((link, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
