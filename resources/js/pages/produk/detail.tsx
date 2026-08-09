import { router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, LogIn, Star, MapPin, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import LoadingOverlay from '@/components/loading-overlay';
import StoreNavbar from '@/components/store-navbar';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/i18n';
import { homepage, login } from '@/routes';
import { add as addToCart } from '@/routes/cart';

interface Outlet {
    nama_outlet: string;
    alamat_outlet: string;
    kota: string;
}

interface Product {
    id: number;
    gambar: string;
    nama_produk: string;
    keterangan: string;
    harga: number;
    harga_diskon: number | null;
    stok: number;
    rating: number;
    outlet?: Outlet | null;
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
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const [loading, setLoading] = useState(false);
    const [buyLoading, setBuyLoading] = useState(false);
    const [jumlah, setJumlah] = useState(1);

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

    const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value === '') {
            setJumlah(1);
            return;
        }

        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            return;
        }

        setJumlah(Math.min(Math.max(Math.floor(parsed), 1), product.stok));
    };

    const handleDecrease = () => {
        setJumlah((prev) => Math.max(1, prev - 1));
    };

    const handleIncrease = () => {
        setJumlah((prev) => Math.min(product.stok, prev + 1));
    };

    const handleBuy = () => {
        if (!user) {
            setLoading(true);
            router.visit(login());
            return;
        }

        if (buyLoading) {
            return;
        }

        setBuyLoading(true);

        router.post(
            addToCart(product.id),
            { jumlah_produk: jumlah },
            {
                preserveScroll: true,
                onFinish: () => setBuyLoading(false),
            },
        );
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

                        {user ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={product.stok <= 0 || buyLoading}
                                onClick={handleBuy}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
                                    product.stok <= 0 || buyLoading
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

                        {/* Divider */}
                        <div className="h-px bg-linear-to-r from-blue-400/20 via-cyan-400/40 to-transparent" />

                        {/* Quantity */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-blue-300">
                                {t('produk.quantity', locale)}:
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDecrease}
                                    disabled={jumlah <= 1 || product.stok <= 0}
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-blue-400/30 text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={product.stok}
                                    value={jumlah}
                                    onChange={handleJumlahChange}
                                    disabled={product.stok <= 0}
                                    className="h-9 w-16 rounded-lg border border-blue-400/30 bg-blue-900/20 text-center text-sm font-semibold text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                />
                                <button
                                    type="button"
                                    onClick={handleIncrease}
                                    disabled={
                                        jumlah >= product.stok ||
                                        product.stok <= 0
                                    }
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-blue-400/30 text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
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

                        {/* Divider */}
                        <div className="h-px bg-linear-to-r from-blue-400/20 via-cyan-400/40 to-transparent" />

                        {/* Shipping Address */}
                        {product.outlet && (
                            <div className="rounded-xl bg-blue-900/20 p-4">
                                <div className="flex items-center gap-2">
                                    <MapPin
                                        size={18}
                                        className="text-cyan-400"
                                    />
                                    <span className="text-sm font-semibold text-blue-200">
                                        {t(
                                            'produk.shipping_address',
                                            locale,
                                        )}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm font-medium text-white">
                                    {product.outlet.nama_outlet}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-blue-300">
                                    {product.outlet.alamat_outlet}
                                    {product.outlet.kota
                                        ? `, ${product.outlet.kota}`
                                        : ''}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <LoadingOverlay show={loading || buyLoading} />
        </div>
    );
}
