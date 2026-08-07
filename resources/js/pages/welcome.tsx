import { router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import StoreNavbar from '@/components/store-navbar';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/i18n';
import { detail } from '@/routes/produk';

interface Product {
    id: number;
    gambar: string;
    nama_produk: string;
    harga: number;
    harga_diskon: number | null;
    id_kategori: number;
}

interface Kategori {
    id: number;
    gambar: string;
    kategori: string;
}

interface Props {
    products: Product[];
    kategoris: Kategori[];
}

const HeroCarousel = memo(function HeroCarousel({
    products,
    index,
    cardClass,
    formatRupiah,
}: Readonly<{
    products: Product[];
    index: number;
    cardClass: string;
    formatRupiah: (v: number) => string;
}>) {
    return (
        <section className="relative flex h-[55vh] items-center justify-center overflow-hidden px-4 sm:h-[65vh] md:h-[75vh]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_70%)]" />

            <AnimatePresence>
                {products.map((product, i) => {
                    const position =
                        (i - index + products.length) % products.length;
                    const isActive = position === 0;

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{
                                opacity: isActive ? 1 : 0.3,
                                scale: isActive ? 1 : 0.75,
                                x:
                                    position *
                                        (window.innerWidth < 640 ? 180 : 300) -
                                    (window.innerWidth < 640 ? 90 : 150),
                                rotateY: 0,
                            }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`absolute h-96 w-72 overflow-hidden rounded-2xl shadow-2xl sm:h-105 sm:w-80 lg:h-120 lg:w-96 ${cardClass}`}
                        >
                            <img
                                src={
                                    product.gambar ||
                                    `https://source.unsplash.com/1200x1200/?product&sig=${product.id}`
                                }
                                alt={product.nama_produk}
                                className="h-full w-full object-cover"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    imageRendering: 'auto',
                                }}
                            />
                            <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-blue-950/90 via-blue-950/70 to-transparent p-5">
                                <h2 className="line-clamp-2 text-lg font-semibold text-white sm:text-xl">
                                    {product.nama_produk}
                                </h2>
                                <p className="mt-1 text-base font-medium text-white sm:text-lg">
                                    {formatRupiah(
                                        product.harga_diskon || product.harga,
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </section>
    );
});

const KategoriSection = memo(function KategoriSection({
    kategoris,
    selectedKategori,
    handleKategoriClick,
    cardClass,
    locale,
    scrollRef,
}: Readonly<{
    kategoris: Kategori[];
    selectedKategori: number | null;
    handleKategoriClick: (id: number | null) => void;
    cardClass: string;
    locale: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}>) {
    return (
        <section
            id="kategori"
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-10"
        >
            <h2 className="mb-8 bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent md:mb-14 md:text-3xl">
                {t('kategori.title', locale)}
            </h2>

            <div className="relative">
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleKategoriClick(null)}
                        className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                            selectedKategori === null
                                ? 'bg-cyan-400 text-blue-950'
                                : `${cardClass}`
                        }`}
                    >
                        {t('kategori.semua', locale)}
                    </motion.button>
                    {kategoris.map((kategori) => (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            key={kategori.id}
                            onClick={() => handleKategoriClick(kategori.id)}
                            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                                selectedKategori === kategori.id
                                    ? 'bg-cyan-400 text-blue-950'
                                    : `${cardClass}`
                            }`}
                        >
                            {kategori.kategori}
                        </motion.button>
                    ))}
                </div>
                <div
                    ref={scrollRef}
                    className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 sm:gap-6 md:gap-8"
                >
                    {kategoris.map((kategori) => (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            key={kategori.id}
                            onClick={() => handleKategoriClick(kategori.id)}
                            className={`min-w-40 overflow-hidden rounded-xl shadow-xl sm:min-w-50 md:min-w-60 md:rounded-2xl ${cardClass} cursor-pointer snap-center ${
                                selectedKategori === kategori.id
                                    ? 'ring-2 ring-cyan-400'
                                    : ''
                            }`}
                        >
                            <div className="relative">
                                <img
                                    src={
                                        kategori.gambar ||
                                        `https://source.unsplash.com/1200x1200/?${kategori.kategori}&sig=${kategori.id}`
                                    }
                                    alt={kategori.kategori}
                                    className="h-40 w-full object-cover sm:h-44 md:h-52"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 to-transparent" />
                            </div>
                            <div className="p-4 md:p-5">
                                <h3 className="text-sm font-semibold tracking-wide md:text-base">
                                    {kategori.kategori}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
});

const ProdukSection = memo(function ProdukSection({
    kategoris,
    selectedKategori,
    handleKategoriClick,
    filteredProducts,
    cardClass,
    locale,
    formatRupiah,
}: Readonly<{
    kategoris: Kategori[];
    selectedKategori: number | null;
    handleKategoriClick: (id: number | null) => void;
    filteredProducts: Product[];
    cardClass: string;
    locale: string;
    formatRupiah: (v: number) => string;
}>) {
    return (
        <section
            id="produk"
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-10"
        >
            <div className="mb-8 flex items-center justify-between">
                <h2 className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
                    {selectedKategori
                        ? `${kategoris.find((k) => k.id === selectedKategori)?.kategori ?? t('produk.fallback', locale)}`
                        : t('produk.title', locale)}
                </h2>
                {selectedKategori && (
                    <button
                        onClick={() => handleKategoriClick(null)}
                        className="rounded-full border border-blue-400/50 px-4 py-1.5 text-sm font-medium text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                        {t('kategori.tampilkan_semua', locale)}
                    </button>
                )}
            </div>

            {filteredProducts.length === 0 ? (
                <p className="py-20 text-center text-blue-400">
                    {t('produk.empty', locale)}
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredProducts.map((product) => (
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            key={product.id}
                            onClick={() => router.visit(detail(product.id))}
                            className={`cursor-pointer overflow-hidden rounded-xl shadow-lg md:rounded-2xl ${cardClass}`}
                        >
                            <div className="relative">
                                <img
                                    src={
                                        product.gambar ||
                                        `https://source.unsplash.com/1200x1200/?product&sig=${product.id}`
                                    }
                                    alt={product.nama_produk}
                                    className="h-40 w-full object-cover sm:h-44 md:h-52"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 to-transparent" />
                            </div>
                            <div className="p-4">
                                <h3 className="line-clamp-2 text-sm font-semibold md:text-base">
                                    {product.nama_produk}
                                </h3>
                                <p className="mt-1 text-sm font-bold text-cyan-300 md:text-base">
                                    {formatRupiah(
                                        product.harga_diskon || product.harga,
                                    )}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
});

export default function WelcomePage(props: Readonly<Props>) {
    const { products, kategoris } = props;
    const { locale } = usePage().props as unknown as { locale: string };
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const [index, setIndex] = useState(0);
    const [selectedKategori, setSelectedKategori] = useState<number | null>(
        null,
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const filteredProducts = useMemo(
        () =>
            selectedKategori
                ? products.filter((p) => p.id_kategori === selectedKategori)
                : products,
        [products, selectedKategori],
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % products.length);
        }, 4500);
        return () => clearInterval(interval);
    }, [products.length]);

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

    const formatRupiah = useCallback(
        (value: number) =>
            new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
            }).format(value),
        [],
    );

    const scrollToSection = useCallback((section: string) => {
        if (section === 'kategori') {
            document
                .getElementById('kategori')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (section === 'produk') {
            document
                .getElementById('produk')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    const handleKategoriClick = useCallback((id: number | null) => {
        setSelectedKategori(id);
        setTimeout(() => {
            const section = document.getElementById('produk');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, []);

    return (
        <div
            className={`${themeClass} min-h-screen transition-colors duration-300`}
        >
            <StoreNavbar onSectionClick={scrollToSection} />

            <HeroCarousel
                products={products}
                index={index}
                cardClass={cardClass}
                formatRupiah={formatRupiah}
            />

            <KategoriSection
                kategoris={kategoris}
                selectedKategori={selectedKategori}
                handleKategoriClick={handleKategoriClick}
                cardClass={cardClass}
                locale={locale}
                scrollRef={scrollRef}
            />

            <ProdukSection
                kategoris={kategoris}
                selectedKategori={selectedKategori}
                handleKategoriClick={handleKategoriClick}
                filteredProducts={filteredProducts}
                cardClass={cardClass}
                locale={locale}
                formatRupiah={formatRupiah}
            />

            <footer className="border-t border-blue-700/30 py-8 text-center text-sm text-blue-400">
                {t('footer.text', locale, { year: new Date().getFullYear() })}
            </footer>
        </div>
    );
}
