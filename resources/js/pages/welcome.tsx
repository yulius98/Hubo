import { router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Search, LogInIcon, Languages } from 'lucide-react';
import LoadingOverlay from '@/components/loading-overlay';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { t } from '@/i18n';
import { login } from '@/routes';
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
    products, index, cardClass, formatRupiah,
}: Readonly<{
    products: Product[];
    index: number;
    cardClass: string;
    formatRupiah: (v: number) => string;
}>) {
    return (
        <section className="relative flex h-[55vh] items-center justify-center overflow-hidden sm:h-[65vh] lg:h-[75vh]">
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
                                        (window.innerWidth < 640
                                            ? 180
                                            : 300) -
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
                                style={{ backfaceVisibility: 'hidden', imageRendering: 'auto' }}
                            />
                            <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-blue-950/90 via-blue-950/70 to-transparent p-5">
                                <h2 className="line-clamp-2 text-lg font-semibold text-white sm:text-xl">
                                    {product.nama_produk}
                                </h2>
                                <p className="mt-1 text-base font-medium text-white sm:text-lg">
                                    {formatRupiah(
                                        product.harga_diskon ||
                                            product.harga,
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

const MobileMenu = memo(function MobileMenu({
    mobileMenuOpen, scrollToTop, scrollToKategori, scrollToProduk, locale, setLocale,
}: Readonly<{
    mobileMenuOpen: boolean;
    scrollToTop: (e: React.MouseEvent) => void;
    scrollToKategori: (e: React.MouseEvent) => void;
    scrollToProduk: (e: React.MouseEvent) => void;
    locale: string;
    setLocale: (l: string) => void;
}>) {
    const [loginLoading, setLoginLoading] = useState(false);
    return (
        <AnimatePresence>
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-blue-700/30 bg-blue-950/80 backdrop-blur-lg md:hidden"
                >
                    <div className="flex flex-col gap-1 px-5 py-4">
                        <button onClick={scrollToTop} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">{t('nav.home', locale)}</button>
                        <button onClick={scrollToKategori} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">{t('nav.kategori', locale)}</button>
                        <button onClick={scrollToProduk} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">{t('nav.produk', locale)}</button>
                        <div className="my-2 border-t border-blue-700/30" />
                        <div className="flex items-center gap-3 rounded-lg px-4 py-3">
                            <Languages size={20} className="text-blue-100" />
                            <div className="flex overflow-hidden rounded-full bg-blue-700/40">
                                <button
                                    onClick={() => setLocale('id')}
                                    className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                >
                                    ID
                                </button>
                                <button
                                    onClick={() => setLocale('en')}
                                    className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { if (!loginLoading) { setLoginLoading(true); router.visit(login()); } }}
                            disabled={loginLoading}
                            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white"
                        >
                            <LogInIcon size={20} /> {t('nav.login', locale)}
                        </button>
                        <LoadingOverlay show={loginLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

const KategoriSection = memo(function KategoriSection({
    kategoris, selectedKategori, handleKategoriClick, cardClass, locale, scrollRef,
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
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20"
        >
            <h2 className="mb-8 bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl lg:mb-14 lg:text-4xl">
                {t('kategori.title', locale)}
            </h2>

            <div className="relative">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
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
                    className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-6 lg:gap-8"
                >
                    {kategoris.map((kategori) => (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            key={kategori.id}
                            onClick={() => handleKategoriClick(kategori.id)}
                            className={`min-w-40 overflow-hidden rounded-2xl shadow-xl sm:min-w-50 lg:min-w-60 ${cardClass} snap-center cursor-pointer ${
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
                                    className="h-40 w-full object-cover sm:h-44 lg:h-52"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 to-transparent" />
                            </div>
                            <div className="p-4">
                                <h3 className="text-sm font-semibold tracking-wide sm:text-base">
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
    kategoris, selectedKategori, handleKategoriClick, filteredProducts, cardClass, locale, formatRupiah,
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
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20"
        >
            <div className="mb-8 flex items-center justify-between">
                <h2 className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl lg:text-4xl">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-8 xl:grid-cols-6">
                {filteredProducts.map((product) => (
                    <motion.div
                        whileHover={{ scale: 1.04 }}
                        key={product.id}
                        onClick={() => router.visit(detail(product.id))}
                        className={`cursor-pointer overflow-hidden rounded-2xl shadow-xl ${cardClass}`}
                    >
                        <div className="relative">
                            <img
                                src={
                                    product.gambar ||
                                    `https://source.unsplash.com/1200x1200/?product&sig=${product.id}`
                                }
                                alt={product.nama_produk}
                                className="h-40 w-full object-cover sm:h-44 lg:h-52"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-blue-950/70 to-transparent" />
                        </div>
                        <div className="p-3 sm:p-4">
                            <h3 className="line-clamp-2 text-xs font-semibold sm:text-sm">
                                {product.nama_produk}
                            </h3>
                            <p className="mt-1 text-sm font-medium sm:text-base">
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

export default function LuxuryEcommerceHomepage(props: Readonly<Props>) {
    const { products, kategoris } = props;
    const { locale } = usePage().props as unknown as { locale: string };
    const [darkMode, setDarkMode] = useState(false);
    const [index, setIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredProducts = useMemo(
        () =>
            selectedKategori
                ? products.filter((p) => p.id_kategori === selectedKategori)
                : products,
        [products, selectedKategori]
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % products.length);
        }, 4500);
        return () => clearInterval(interval);
    }, [products.length]);

    const themeClass = useMemo(
        () =>
            darkMode
                ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-black text-white'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-blue-950',
        [darkMode]
    );

    const cardClass = useMemo(
        () =>
            darkMode
                ? 'bg-blue-900/60 backdrop-blur-xl border border-blue-700/40 text-white'
                : 'bg-white/80 backdrop-blur-xl border border-blue-200 text-blue-950',
        [darkMode]
    );

    const formatRupiah = useCallback((value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(value), []);

    const scrollToTop = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
        setMobileMenuOpen(false);
    }, []);

    const scrollToKategori = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const section = document.getElementById('kategori');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setMobileMenuOpen(false);
    }, []);

    const scrollToProduk = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const section = document.getElementById('produk');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setMobileMenuOpen(false);
    }, []);

    const handleKategoriClick = useCallback((id: number | null) => {
        setSelectedKategori(id);
        setMobileMenuOpen(false);
        setTimeout(() => {
            const section = document.getElementById('produk');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, []);

    const setLocale = useCallback((l: string) => {
        router.post('/set-locale', { locale: l }, { preserveScroll: true });
    }, []);

    return (
        <div
            className={`${themeClass} min-h-screen transition-colors duration-300`}
        >
            <nav className="sticky top-0 z-50 border-b border-blue-700/30 bg-blue-900/70 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between md:h-20">
                        <h1 className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-bold tracking-wider text-transparent md:text-3xl">
                            HUBO
                        </h1>

                        <div className="hidden items-center gap-8 md:flex">
                            <button onClick={scrollToTop} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">{t('nav.home', locale)}</button>
                            <button onClick={scrollToKategori} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">{t('nav.kategori', locale)}</button>
                            <button onClick={scrollToProduk} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">{t('nav.produk', locale)}</button>
                        </div>

                        <div className="hidden items-center gap-5 md:flex lg:gap-7">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-300" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('search.placeholder', locale)}
                                    className="w-full rounded-full border border-blue-400/30 bg-white/10 py-2 pr-4 pl-9 text-sm text-white placeholder-blue-300/50 transition outline-none focus:border-cyan-400 focus:bg-white/20 lg:w-72"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => { if (!loginLoading) { setLoginLoading(true); router.visit(login()); } }}
                                disabled={loginLoading}
                                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
                            >
                                <LogInIcon size={18} />
                                <span>{t('nav.login', locale)}</span>
                            </button>

                            <div className="flex overflow-hidden rounded-full bg-blue-500/20">
                                <button
                                    onClick={() => setLocale('id')}
                                    className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                >
                                    ID
                                </button>
                                <button
                                    onClick={() => setLocale('en')}
                                    className={`px-3 py-1.5 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300 hover:text-white'}`}
                                >
                                    EN
                                </button>
                            </div>

                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="rounded-full p-2 text-blue-100 transition hover:bg-blue-500/20 hover:text-white"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 md:hidden">
                            <div className="flex overflow-hidden rounded-full bg-blue-500/20">
                                <button
                                    onClick={() => setLocale('id')}
                                    className={`px-2 py-1 text-xs font-semibold transition ${locale === 'id' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300'}`}
                                >
                                    ID
                                </button>
                                <button
                                    onClick={() => setLocale('en')}
                                    className={`px-2 py-1 text-xs font-semibold transition ${locale === 'en' ? 'bg-cyan-400 text-blue-950' : 'text-blue-300'}`}
                                >
                                    EN
                                </button>
                            </div>
                            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-blue-100">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-blue-100"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                <MobileMenu
                    mobileMenuOpen={mobileMenuOpen}
                    scrollToTop={scrollToTop}
                    scrollToKategori={scrollToKategori}
                    scrollToProduk={scrollToProduk}
                    locale={locale}
                    setLocale={setLocale}
                />
            </nav>

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

            <footer className="border-t border-blue-700/30 px-4 py-8 text-center text-sm text-blue-400">
                {t('footer.text', locale, { year: new Date().getFullYear() })}
            </footer>

            <LoadingOverlay show={loginLoading} />
        </div>
    );
}
