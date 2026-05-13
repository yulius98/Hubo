import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Search, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { logout, myprofile } from '@/routes';

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

interface User {
    id: number;
    avatar: string;
    name: string;
    email: string;
}

interface Props {
    products: Product[];
    kategoris: Kategori[];
    user: User;
}

export default function Homepage(props: Readonly<Props>) {
    const { products, kategoris, user } = props;
    const [darkMode, setDarkMode] = useState(false);
    const [index, setIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const filteredProducts = selectedKategori
        ? products.filter((p) => p.id_kategori === selectedKategori)
        : products;

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % products.length);
        }, 4500);
        return () => clearInterval(interval);
    }, [products.length]);

    const themeClass = darkMode
        ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-black text-white'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100 text-blue-950';

    const cardClass = darkMode
        ? 'bg-blue-900/60 backdrop-blur-xl border border-blue-700/40 text-white'
        : 'bg-white/80 backdrop-blur-xl border border-blue-200 text-blue-950';

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(value);

    const scrollToTop = (e: React.MouseEvent) => {
        e.preventDefault(); // cegah perilaku default link jika pakai <a>
        window.scrollTo({
            top: 0,
            behavior: 'smooth', // smooth scroll
        });
        setMobileMenuOpen(false); // tutup menu mobile kalau terbuka
    };

    const scrollToKategori = (e: React.MouseEvent) => {
        e.preventDefault();
        const section = document.getElementById('kategori');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Tutup mobile menu setelah klik
        setMobileMenuOpen(false);
    };

    const scrollToProduk = (e: React.MouseEvent) => {
        e.preventDefault();
        const section = document.getElementById('produk');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Tutup mobile menu setelah klik
        setMobileMenuOpen(false);
    };

    const handleKategoriClick = (id: number | null) => {
        setSelectedKategori(id);
        setMobileMenuOpen(false);
        setTimeout(() => {
            const section = document.getElementById('produk');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <div
            className={`${themeClass} min-h-screen transition-all duration-500`}
        >
            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-blue-700/30 bg-blue-900/70 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between md:h-20">
                        {/* Logo */}
                        <h1 className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-bold tracking-wider text-transparent md:text-3xl">
                            HUBO
                        </h1>

                        {/* Desktop Menu */}
                        <div className="hidden items-center gap-8 md:flex">
                            <button onClick={scrollToTop} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">Home</button>
                            <button onClick={scrollToKategori} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">Kategori</button>
                            <button onClick={scrollToProduk} className="cursor-pointer text-sm font-medium text-blue-100 transition hover:text-white">Produk</button>
                        </div>

                        {/* Desktop Right */}
                        <div className="hidden items-center gap-5 md:flex lg:gap-7">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-blue-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari produk..."
                                    className="w-full rounded-full border border-blue-400/30 bg-white/10 py-2 pr-4 pl-9 text-sm text-white placeholder-blue-300/50 transition outline-none focus:border-cyan-400 focus:bg-white/20 lg:w-72"
                                />
                            </div>

                            <span className="text-sm font-medium text-blue-100">Hi, {user?.name ?? 'Guest'}!</span>

                            <Link href={myprofile()} className="flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white">
                                <img
                                    src={user?.avatar ?? '/images/default-avatar.png'}
                                    alt="Profile"
                                    className="h-8 w-8 rounded-full border-2 border-cyan-400/40 object-cover transition hover:border-cyan-400"
                                />
                                <span>Profil</span>
                            </Link>

                            <Link href={logout()} className="flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </Link>

                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="rounded-full p-2 text-blue-100 transition hover:bg-blue-500/20 hover:text-white"
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>

                        {/* Mobile Right */}
                        <div className="flex items-center gap-2 md:hidden">
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

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-blue-700/30 bg-blue-950/80 backdrop-blur-lg md:hidden"
                        >
                            <div className="flex flex-col gap-1 px-5 py-4">
                                <button onClick={scrollToTop} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">Home</button>
                                <button onClick={scrollToKategori} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">Kategori</button>
                                <button onClick={scrollToProduk} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">Produk</button>
                                <div className="my-2 border-t border-blue-700/30" />
                                <Link href={myprofile()} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-blue-100 transition hover:bg-blue-800/40 hover:text-white">
                                    <img src={user?.avatar ?? '/images/default-avatar.png'} alt="" className="h-7 w-7 rounded-full object-cover" />
                                    {user?.name ?? 'Guest'}
                                </Link>
                                <Link href={logout()} className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-300 transition hover:bg-blue-800/40 hover:text-red-200">
                                    <LogOut size={20} /> Logout
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Carousel - lebih kecil di mobile */}
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
                                            (window.innerWidth < 640
                                                ? 180
                                                : 300) -
                                        (window.innerWidth < 640 ? 90 : 150),
                                    rotateY: 0,
                                }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`absolute h-96 w-72 overflow-hidden rounded-2xl shadow-2xl sm:h-[420px] sm:w-80 lg:h-[480px] lg:w-96 ${cardClass}`}
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
                                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-blue-950/90 via-blue-950/70 to-transparent p-5">
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

            {/* Kategori Section */}
            <section
                id="kategori"
                className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-10"
            >
                <h2 className="mb-8 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent md:mb-14 md:text-3xl">
                    Kategori
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
                            Semua
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
                                className={`min-w-[160px] overflow-hidden rounded-xl shadow-xl sm:min-w-[200px] md:min-w-[240px] md:rounded-2xl ${cardClass} snap-center cursor-pointer ${
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 to-transparent" />
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

            {/* Featured Products */}
            <section
                id="produk"
                className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-10"
            >
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
                        {selectedKategori
                            ? `${kategoris.find((k) => k.id === selectedKategori)?.kategori ?? 'Produk'}`
                            : 'Featured Product'}
                    </h2>
                    {selectedKategori && (
                        <button
                            onClick={() => handleKategoriClick(null)}
                            className="rounded-full border border-blue-400/50 px-4 py-1.5 text-sm font-medium text-blue-200 transition hover:border-cyan-400 hover:text-cyan-300"
                        >
                            Tampilkan Semua
                        </button>
                    )}
                </div>

                {filteredProducts.length === 0 ? (
                    <p className="py-20 text-center text-blue-400">
                        Tidak ada produk dalam kategori ini.
                    </p>
                ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredProducts.map((product) => (
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            key={product.id}
                            className={`overflow-hidden rounded-xl shadow-lg md:rounded-2xl ${cardClass}`}
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
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 to-transparent" />
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

            {/* Footer */}
            <footer className="border-t border-blue-700/30 py-8 text-center text-sm text-blue-400">
                © {new Date().getFullYear()} HUBO. Premium Shopping Experience.
            </footer>
        </div>
    );
}
