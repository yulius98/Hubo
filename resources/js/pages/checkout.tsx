import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    MapPin,
    Package,
    ShoppingBag,
    StickyNote,
    Truck,
    Wallet,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CartItem {
    id: number;
    id_produk: number;
    nama_produk: string;
    gambar: string | null;
    harga: number;
    harga_diskon: number | null;
    jumlah: number;
    subtotal: number;
}

interface CheckoutProps {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    active_gateway: string | null;
    user: { name: string; email: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pesanan Saya', href: '/pesanan-saya' },
    { title: 'Checkout', href: '/checkout' },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Transfer Bank', icon: Building2Icon, desc: 'BCA, BRI, Mandiri, BNI' },
    { value: 'ewallet', label: 'E-Wallet', icon: Wallet, desc: 'GoPay, OVO, DANA, ShopeePay' },
    { value: 'va', label: 'Virtual Account', icon: CreditCard, desc: 'VA BCA, BRI, Mandiri' },
    { value: 'card', label: 'Kartu Kredit/Debit', icon: CreditCard, desc: 'Visa, Mastercard, JCB' },
    { value: 'cod', label: 'Bayar di Tempat', icon: Truck, desc: 'Cash On Delivery' },
] as const;

function Building2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" /><path d="M16 6h.01" />
            <path d="M12 6h.01" /><path d="M12 10h.01" />
            <path d="M12 14h.01" /><path d="M16 10h.01" />
            <path d="M16 14h.01" /><path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    );
}

export default function Checkout({
    cartItems,
    subtotal,
    tax,
    total,
    active_gateway,
    user,
}: Readonly<CheckoutProps>) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        shipping_address: '',
        notes: '',
        payment_method: 'bank_transfer',
    });

    const submit = () => {
        post('/checkout');
    };

    const inputClass =
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Checkout" />

            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <button
                        type="button"
                        onClick={() => router.visit('/pesanan-saya')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Keranjang
                    </button>
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <ShoppingBag className="h-8 w-8 text-indigo-500" />
                        Checkout
                    </h1>
                </div>

                {flash?.error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
                                <MapPin className="h-5 w-5 text-indigo-500" />
                                Alamat Pengiriman
                            </h2>
                            <textarea
                                value={data.shipping_address}
                                onChange={(e) => setData('shipping_address', e.target.value)}
                                rows={3}
                                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:bg-gray-800 dark:text-gray-100 ${errors.shipping_address ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                                placeholder="Alamat lengkap pengiriman..."
                            />
                            {errors.shipping_address && (
                                <p className="mt-1 text-xs text-red-500">{errors.shipping_address}</p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
                                <CreditCard className="h-5 w-5 text-indigo-500" />
                                Metode Pembayaran
                                {!active_gateway && (
                                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                        Offline Only
                                    </span>
                                )}
                            </h2>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    return (
                                        <label
                                            key={method.value}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                                                data.payment_method === method.value
                                                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30'
                                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.value}
                                                checked={data.payment_method === method.value}
                                                onChange={(e) => setData('payment_method', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Icon className="h-5 w-5 shrink-0 text-indigo-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {method.label}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {method.desc}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
                                <StickyNote className="h-5 w-5 text-indigo-500" />
                                Catatan (Opsional)
                            </h2>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                placeholder="Catatan untuk penjual..."
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
                                <Package className="h-5 w-5 text-indigo-500" />
                                Ringkasan Pesanan
                            </h2>

                            <div className="max-h-60 space-y-3 overflow-y-auto">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                            {item.gambar ? (
                                                <img src={item.gambar} alt={item.nama_produk} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.nama_produk}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.jumlah} x {formatRupiah(item.subtotal / item.jumlah)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {formatRupiah(item.subtotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>PPN (11%)</span>
                                    <span>{formatRupiah(tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                                    <span>Total</span>
                                    <span>{formatRupiah(total)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing || cartItems.length === 0}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    'Memproses...'
                                ) : (
                                    <>
                                        <ShoppingBag className="h-4 w-4" />
                                        Buat Pesanan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
