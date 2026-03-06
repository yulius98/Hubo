import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, ShoppingBag, Search, User, LogInIcon } from "lucide-react";
import { Head, Link, usePage } from '@inertiajs/react';
import { homepage, login } from '@/routes';


interface Product {
  id: number;
  gambar: string;
  nama_produk: string;
  harga: number;
  harga_diskon: number | null;
}

interface Kategori {
    id: number
    gambar: string
    kategori: string
}

interface Props {
  products: Product[]
  kategoris: Kategori[]
}

export default function LuxuryEcommerceHomepage({ products, kategoris }: Props) {
  const [darkMode, setDarkMode] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const themeClass = darkMode
    ? "bg-gradient-to-br from-blue-950 via-blue-900 to-black text-white"
    : "bg-gradient-to-br from-blue-50 via-white to-blue-100 text-blue-950";

  const cardClass = darkMode
    ? "bg-blue-900/60 backdrop-blur-xl border border-blue-700/40 text-white"
    : "bg-white/80 backdrop-blur-xl border border-blue-200 text-blue-950";

  const formatRupiah = (value: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)

    return (
        <div className={`${themeClass} min-h-screen transition-all duration-500`}>
        {/* Luxury Navbar */}
        <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-blue-900/40 border-b border-blue-700/30">
            <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-10">
                <h1 className="text-3xl font-bold tracking-widest bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                HUBO
                </h1>
                <div className="hidden md:flex gap-8 text-sm font-medium font-bold">
                <a className="hover:text-cyan-300 transition">Home</a>
                <a className="hover:text-cyan-300 transition">Produk</a>
                <a className="hover:text-cyan-300 transition">Produk Baru</a>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <Search
                    className="cursor-pointer hover:text-cyan-300 transition"
                    size={18}
                />
                <input
                    type="text"
                    placeholder="Cari..."
                    className="w-150 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />

                {/* <LogInIcon className="cursor-pointer hover:text-cyan-300 transition" size={18} /> */}
                <Link
                    href={login()}
                    className="flex items-center gap-2 cursor-pointer hover:text-cyan-300 transition"
                >
                    <LogInIcon size={18} />
                    <span className="text-sm font-medium font-bold">Login</span>
                </Link>

                <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full border border-blue-400/40 hover:bg-blue-500/20 transition"
                >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
            </div>
        </nav>

        {/* Unique Blue Carousel */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_70%)]" />
            <AnimatePresence>
            {products.map((product, i) => {
                const position = (i - index + products.length) % products.length;
                const isActive = position === 0;

                return (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
                    animate={{
                    opacity: isActive ? 1 : 0.25,
                    scale: isActive ? 1.15 : 0.8,
                    rotateY: isActive ? 0 : position > 0 ? -25 : 25,
                    x: position * 260 - 260,
                    }}
                    transition={{ duration: 0.9 }}
                    className={`absolute w-80 h-96 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.4)] ${cardClass}`}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <img
                    src={product.gambar || `https://source.unsplash.com/600x600/?product&sig=${product.id}`}
                    alt={product.nama_produk}
                    className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-blue-950/90 to-transparent">
                    <h2 className="text-xl font-semibold">{product.nama_produk}</h2>
                    <p className="text-sm opacity-80">{formatRupiah(product.harga_diskon || product.harga)}</p>
                    </div>
                </motion.div>
                );
            })}
            </AnimatePresence>
        </section>

        {/* Kategori */}
        <section className="px-10 py-20 max-w-7xl mx-auto">
            <h2 className="text-3xl font-semibold mb-14 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Kategori
            </h2>

            <div className="relative ">
                {/* Tombol kiri */}
                <button
                onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2"
                >
                ◀
                </button>

                {/* Wrapper scroll */}
                <div
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth"
                >
                {kategoris.map((kategori) => (
                    <motion.div
                    whileHover={{ scale: 1.08 }}
                    key={kategori.id}
                    className={`min-w-[200px] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] ${cardClass} my-4`}
                    >
                    <div className="relative">
                        <img
                        src={
                            kategori.gambar ||
                            `https://source.unsplash.com/600x600/?product&sig=${kategori.id}`
                        }
                        alt={kategori.kategori}
                        className="h-44 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 to-transparent" />
                    </div>
                    <div className="p-4">
                        <h3 className="text-sm font-semibold tracking-wide">
                        {kategori.kategori}
                        </h3>
                    </div>
                    </motion.div>
                ))}
                </div>

                {/* Tombol kanan */}
                <button
                onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full p-2"
                >
                ▶
                </button>
            </div>
        </section>



        {/* Product Grid */}
        <section className="px-10 py-20 max-w-7xl mx-auto">
            <h2 className="text-3xl font-semibold mb-14 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Featured Product
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {products.map((product) => (
                <motion.div
                whileHover={{ scale: 1.08 }}
                key={product.id}
                className={`rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] ${cardClass}`}
                >
                <div className="relative">
                    <img
                    src={product.gambar || `https://source.unsplash.com/600x600/?product&sig=${product.id}`}
                    alt={product.nama_produk}
                    className="h-44 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 to-transparent" />
                </div>
                <div className="p-4">
                    <h3 className="text-sm font-semibold tracking-wide">
                    {product.nama_produk}
                    </h3>
                    <p className="text-xs opacity-70 mt-1">{formatRupiah(product.harga_diskon || product.harga)}</p>
                </div>
                </motion.div>
            ))}
            </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-blue-300/70 border-t border-blue-700/30">
            © 2026 LUXE. Designed for premium experience.
        </footer>
        </div>
    )
}
