import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2,
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import StoreNavbar from '@/components/store-navbar';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/i18n';
import { homepage } from '@/routes';
import { checkout as checkoutCart, deleteMethod } from '@/routes/pesanan_saya';

interface CartItem {
    id: number;
    id_produk: number;
    nama_produk: string;
    gambar: string | null;
    harga: number;
    harga_diskon: number | null;
    stok: number;
    jumlah: number;
    subtotal: number;
}

interface Props {
    cartItems: CartItem[];
    total: number;
}

export default function PesananSaya(props: Readonly<Props>) {
    const { cartItems, total } = props;
    const { locale, flash } = usePage().props as unknown as {
        locale: string;
        flash?: { success?: string; error?: string };
    };
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const [loading, setLoading] = useState(false);

    const themeClass = useMemo(
        () =>
            isDark
                ? 'bg-linear-to-br from-blue-950 via-blue-900 to-black text-white'
                : 'bg-linear-to-br from-blue-50 via-white to-blue-100 text-blue-950',
        [isDark],
    );

    const cardClass = useMemo(
        () =>
            isDark
                ? 'bg-blue-900/60 backdrop-blur-xl border border-blue-700/40 text-white'
                : 'bg-white/80 backdrop-blur-xl border border-blue-200 text-blue-950',
        [isDark],
    );

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);

    const handleBack = () => {
        if (!loading) {
            setLoading(true);
            router.visit(homepage());
        }
    };

    const handleDelete = (item: CartItem) => {
        if (!globalThis.window.confirm(t('pesanan.delete_confirm', locale))) {
            return;
        }

        setLoading(true);
        router.delete(deleteMethod(item.id), {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleCheckout = () => {
        if (loading) {
            return;
        }

        setLoading(true);
        router.post(
            checkoutCart(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <div
            className={`${themeClass} min-h-screen transition-colors duration-300`}
        >
            <StoreNavbar showSections={false} />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
                            {t('pesanan.title', locale)}
                        </h1>
                        <p className="mt-1 text-sm text-blue-400 dark:text-blue-300">
                            {t('pesanan.subtitle', locale)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={loading}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-400/50 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                    >
                        <ArrowLeft size={18} />
                        {t('pesanan.back', locale)}
                    </button>
                </div>

                {(flash?.success || flash?.error) && (
                    <div
                        className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                            flash?.success
                                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-400/40 bg-red-500/10 text-red-300'
                        }`}
                    >
                        <CheckCircle2 size={18} className="shrink-0" />
                        {flash?.success ?? flash?.error}
                    </div>
                )}

                {cartItems.length === 0 ? (
                    <div
                        className={`flex flex-col items-center rounded-2xl border p-12 text-center ${cardClass}`}
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-400">
                            <ShoppingCart size={32} />
                        </div>
                        <h2 className="mt-6 text-lg font-semibold">
                            {t('pesanan.title', locale)}
                        </h2>
                        <p className="mt-2 text-sm text-blue-400 dark:text-blue-300">
                            {t('pesanan.empty', locale)}
                        </p>
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={loading}
                            className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                        >
                            <ShoppingCart size={18} />
                            {t('pesanan.browse', locale)}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="flex flex-col gap-4 lg:col-span-3">
                            {cartItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                    }}
                                    className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${cardClass}`}
                                >
                                    <img
                                        src={
                                            item.gambar ||
                                            `https://source.unsplash.com/300x300/?product&sig=${item.id_produk}`
                                        }
                                        alt={item.nama_produk}
                                        className="h-24 w-24 shrink-0 rounded-xl object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="line-clamp-2 text-base font-semibold">
                                            {item.nama_produk}
                                        </h3>
                                        <p className="mt-1 text-sm text-blue-400 dark:text-blue-300">
                                            {formatRupiah(
                                                item.harga_diskon ||
                                                    item.harga,
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm text-cyan-400">
                                            {formatRupiah(item.subtotal)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xs text-blue-400 dark:text-blue-300">
                                                {t('pesanan.quantity', locale)}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1 text-sm font-bold">
                                                <Minus size={14} className="text-blue-400/60" />
                                                {item.jumlah}
                                                <Plus size={14} className="text-blue-400/60" />
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            disabled={loading}
                                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            <Trash2 size={16} />
                                            {t('pesanan.delete', locale)}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="lg:col-span-2">
                            <div
                                className={`sticky top-24 rounded-2xl border p-6 ${cardClass}`}
                            >
                                <h2 className="text-lg font-semibold">
                                    {t('pesanan.summary', locale)}
                                </h2>
                                <div className="mt-4 space-y-3">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between gap-3 text-sm"
                                        >
                                            <span className="line-clamp-1 text-blue-400 dark:text-blue-300">
                                                {item.nama_produk} × {item.jumlah}
                                            </span>
                                            <span className="shrink-0 font-medium">
                                                {formatRupiah(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 flex justify-between border-t border-blue-400/20 pt-4 text-lg font-bold">
                                    <span>{t('pesanan.total', locale)}</span>
                                    <span className="text-cyan-300">
                                        {formatRupiah(total)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CheckCircle2 size={18} />
                                    {t('pesanan.checkout', locale)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <LoadingOverlay show={loading} />
        </div>
    );
}
