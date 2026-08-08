import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, LogIn, Star, Sun, Moon } from 'lucide-react';
import { useMemo, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import StoreNavbar from '@/components/store-navbar';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/i18n';
import { homepage, login } from '@/routes';

interface Product {
    id: number;
    gambar: string;
    nama_produk: string;
    keterangan: string;
    harga: number;
    harga_diskon: number | null;
    stok: number;
    rating: number;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    product: Product;
    user: User | null;
}

export default function ProductDetail(props: Readonly<Props>) {
    const { product, user } = props;
    const { locale } = usePage().props as unknown as { locale: string };
    const { resolvedAppearance, updateAppearance } = useAppearance();
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
        }).format(value);

    const handleBack = () => {
        if (user) {
            router.visit(homepage());
        } else {
            router.visit('/');
        }
    };

    const handleBuy = () => {
        if (!user) {
            setLoading(true);
            router.visit(login());
        }
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalf = rating - fullStars >= 0.5;
        const stars = [];

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(
                    <Star
                        key={i}
                        className="fill-yellow-400 text-yellow-400"
                        size={18}
                    />,
                );
            } else if (i === fullStars + 1 && hasHalf) {
                stars.push(
                    <span key={i} className="relative">
                        <Star className="text-yellow-400/30" size={18} />
                        <Star
                            className="absolute inset-0 fill-yellow-400 text-yellow-400"
                            size={18}
                            style={{ clipPath: 'inset(0 50% 0 0)' }}
                        />
                    </span>,
                );
            } else {
                stars.push(
                    <Star key={i} className="text-yellow-400/30" size={18} />,
                );
            }
        }
        return stars;
    };

    return (
        <div
            className={`${themeClass} min-h-screen transition-colors duration-300`}
        >
            <StoreNavbar showSections={false} />

            <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
                {/* Left Column - Image */}
                <div className="relative flex min-h-[50vh] w-full items-center justify-center overflow-hidden lg:min-h-screen lg:w-1/2">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_70%)]" />

                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        src={
                            product.gambar
                                ? `/${product.gambar}`
                                : `https://source.unsplash.com/1200x1200/?product&sig=${product.id}`
                        }
                        alt={product.nama_produk}
                        className="h-full w-full object-cover"
                    />

                    {/* Overlay Buttons */}
                    <div className="absolute right-0 bottom-0 left-0 flex gap-3 bg-linear-to-t from-blue-950/90 via-blue-950/50 to-transparent p-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBack}
                            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                        >
                            <ArrowLeft size={18} />
                            {t('produk.back', locale)}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                                updateAppearance(isDark ? 'light' : 'dark')
                            }
                            className="rounded-full p-2 ..."
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </motion.button>

                        {user ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={product.stok <= 0}
                                onClick={handleBuy}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
                                    product.stok <= 0
                                        ? 'cursor-not-allowed bg-gray-500/50'
                                        : 'bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500'
                                }`}
                            >
                                <ShoppingCart size={18} />
                                {t('produk.buy', locale)}
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBuy}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:from-cyan-400 hover:to-blue-500"
                            >
                                <LogIn size={18} />
                                {t('nav.login', locale)}
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.2,
                            ease: 'easeOut',
                        }}
                        className={`w-full max-w-lg space-y-6 rounded-2xl p-8 ${cardClass}`}
                    >
                        {/* Product Name */}
                        <h1 className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                            {product.nama_produk}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                                {renderStars(product.rating)}
                            </div>
                            <span className="text-sm font-medium text-blue-400">
                                ({product.rating.toFixed(1)})
                            </span>
                            <span className="text-xs text-blue-300">
                                {t('produk.rating', locale)}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-linear-to-r from-blue-400/20 via-cyan-400/40 to-transparent" />

                        {/* Description */}
                        <div>
                            <p className="text-sm leading-relaxed text-blue-300 md:text-base">
                                {product.keterangan || 'Tidak ada deskripsi.'}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-linear-to-r from-blue-400/20 via-cyan-400/40 to-transparent" />

                        {/* Stock */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-blue-300">
                                {t('produk.stock', locale)}:
                            </span>
                            {product.stok > 0 ? (
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
                                    {t('produk.stock_available', locale)} (
                                    {product.stok})
                                </span>
                            ) : (
                                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-400">
                                    {t('produk.stock_empty', locale)}
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="rounded-xl bg-blue-900/20 p-4">
                            {product.harga_diskon ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-blue-400 line-through">
                                        {formatRupiah(product.harga)}
                                    </span>
                                    <span className="text-2xl font-bold text-cyan-300 md:text-3xl">
                                        {formatRupiah(product.harga_diskon)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-2xl font-bold text-cyan-300 md:text-3xl">
                                    {formatRupiah(product.harga)}
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <LoadingOverlay show={loading} />
        </div>
    );
}
