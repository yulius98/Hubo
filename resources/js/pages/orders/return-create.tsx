import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckSquare, Package, RotateCcw, Square } from 'lucide-react';
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

interface OrderForReturn {
    id: number;
    order_number: string;
    status: string;
    total: number;
    items: OrderItem[];
}

interface ReturnCreateProps {
    order: OrderForReturn;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Riwayat Pesanan', href: '/orders' },
    { title: 'Ajukan Retur', href: '#' },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const orderStatusLabel = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'Menunggu';
        case 'awaiting_payment':
            return 'Menunggu Pembayaran';
        case 'paid':
            return 'Dibayar';
        case 'processing':
            return 'Diproses';
        case 'shipped':
            return 'Dikirim';
        case 'completed':
            return 'Selesai';
        case 'cancelled':
            return 'Dibatalkan';
        case 'expired':
            return 'Kedaluwarsa';
        default:
            return status;
    }
};

const orderStatusBadgeClass = (status: string): string => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'processing':
        case 'shipped':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
        case 'paid':
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
        case 'cancelled':
        case 'expired':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        default:
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    }
};

export default function ReturnCreatePage({ order }: Readonly<ReturnCreateProps>) {
    const { data, setData, post, processing, errors } = useForm({
        order_id: order.id,
        reason: '',
        items: order.items.map((item) => ({
            order_item_id: item.id,
            quantity: 0,
            reason: '',
        })),
    });

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

    const textareaClass =
        'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

    const toggleItem = (index: number) => {
        const items = [...data.items];
        if (items[index].quantity > 0) {
            items[index] = { ...items[index], quantity: 0 };
        } else {
            items[index] = { ...items[index], quantity: 1 };
        }
        setData('items', items);
    };

    const setItemQuantity = (index: number, qty: number) => {
        const items = [...data.items];
        const maxQty = order.items[index].quantity;
        const clamped = Math.max(0, Math.min(qty, maxQty));
        items[index] = { ...items[index], quantity: clamped };
        if (clamped > 0 && items[index].quantity === 0) {
            items[index] = { ...items[index], quantity: clamped };
        }
        setData('items', items);
    };

    const setItemReason = (index: number, reason: string) => {
        const items = [...data.items];
        items[index] = { ...items[index], reason };
        setData('items', items);
    };

    const selectedItems = data.items.filter((item) => item.quantity > 0);
    const hasSelectedItems = selectedItems.length > 0;
    const selectedTotal = selectedItems.reduce((sum, item) => {
        const original = order.items.find((oi) => oi.id === item.order_item_id);
        return sum + (original?.subtotal ?? 0) * (item.quantity / (original?.quantity ?? 1));
    }, 0);

    const submit = () => {
        post('/returns');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajukan Retur" />

            <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <Link
                        href={`/orders/${order.id}`}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Detail Pesanan
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                                <RotateCcw className="h-8 w-8 text-indigo-500" />
                                Ajukan Retur
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Pilih item yang ingin dikembalikan dan jelaskan alasan retur.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Order Info Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Informasi Pesanan
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Nomor Pesanan
                                </p>
                                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {order.order_number}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Status Pesanan
                                </p>
                                <span
                                    className={`mt-0.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusBadgeClass(order.status)}`}
                                >
                                    {orderStatusLabel(order.status)}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Total Pesanan
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatRupiah(order.total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Selection Table */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            <Package className="h-5 w-5 text-indigo-500" />
                            Pilih Item untuk Diretur
                        </h2>

                        {errors.items && typeof errors.items === 'string' && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                                {errors.items}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="w-10 px-4 py-2.5" />
                                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Produk
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Harga
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Jumlah
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {order.items.map((item, index) => {
                                        const isSelected = data.items[index].quantity > 0;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={`transition ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleItem(index)}
                                                        className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="h-5 w-5" />
                                                        ) : (
                                                            <Square className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                                            {item.gambar ? (
                                                                <img
                                                                    src={item.gambar}
                                                                    alt={item.product_name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <Package className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            {item.product_name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {formatRupiah(item.price)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {isSelected ? (
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={item.quantity}
                                                            value={data.items[index].quantity}
                                                            onChange={(e) =>
                                                                setItemQuantity(index, parseInt(e.target.value) || 0)
                                                            }
                                                            className="h-9 w-20 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {item.quantity}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                                                    {formatRupiah(item.subtotal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {errors[`items.${selectedItems.length - 1}.order_item_id`] && (
                            <p className="mt-2 text-xs text-red-500">
                                {String(errors[`items.${selectedItems.length - 1}.order_item_id`])}
                            </p>
                        )}
                    </div>

                    {/* Per-Item Reasons */}
                    {hasSelectedItems && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                Alasan Per Item
                            </h2>
                            <div className="space-y-4">
                                {data.items.map((formItem, index) => {
                                    if (formItem.quantity <= 0) return null;
                                    const original = order.items[index];
                                    return (
                                        <div key={original.id}>
                                            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {original.product_name}
                                                <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                    (x{formItem.quantity})
                                                </span>
                                            </p>
                                            <input
                                                type="text"
                                                value={formItem.reason}
                                                onChange={(e) => setItemReason(index, e.target.value)}
                                                placeholder="Contoh: Produk rusak, tidak sesuai, dll."
                                                className={inputClass}
                                            />
                                            {errors[`items.${index}.reason`] && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {String(errors[`items.${index}.reason`])}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Overall Reason */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Alasan Retur (Umum)
                        </h2>
                        <textarea
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            rows={4}
                            placeholder="Jelaskan alasan pengembalian barang secara umum..."
                            className={textareaClass}
                        />
                        {errors.reason && (
                            <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                        )}
                    </div>

                    {/* Summary & Submit */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedItems.length} item dipilih
                                </p>
                                {hasSelectedItems && (
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Estimasi Refund: {formatRupiah(selectedTotal)}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing || !hasSelectedItems}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {processing ? 'Mengirim...' : 'Ajukan Retur'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
