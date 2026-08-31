import {
    MagnifyingGlassIcon,
    ShoppingBagIcon,
    PlusIcon,
    MinusIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { add as addToCart } from '@/routes/cart';

interface Variant {
    id: number;
    name: string;
    harga: number | null;
    stok: number;
    is_active: boolean;
}

interface Product {
    id: number;
    nama_produk: string;
    harga: number;
    harga_diskon: number | null;
    gambar: string | null;
    stok: number;
    min_stok: number;
    display_price: number;
    variants: Variant[];
    kategori?: { id: number; kategori: string } | null;
}

interface OutletInfo {
    id: number;
    nama_outlet: string;
    slug: string;
    gambar: string | null;
    alamat_outlet: string | null;
    kota: string | null;
    telp: string | null;
}

interface StorefrontPageProps extends InertiaPageProps {
    outlet: OutletInfo;
    kategoris: { id: number; kategori: string; gambar: string | null }[];
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    search: string;
    selectedKategori: number;
}

export const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export default function StorefrontPage() {
    const { outlet, kategoris, products, search, selectedKategori } =
        usePage<StorefrontPageProps>().props;

    const [query, setQuery] = useState(search);
    const [selectedVariant, setSelectedVariant] = useState<
        Record<number, number>
    >({});
    const [qty, setQty] = useState<Record<number, number>>({});

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            window.location.pathname,
            { q: query || undefined },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const filterByKategori = (id: number) => {
        router.get(
            window.location.pathname,
            { kategori: id || undefined, q: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const loadPage = (link: string) => {
        router.get(link, {}, { preserveState: true, preserveScroll: true });
    };

    const handleAddToCart = (product: Product) => {
        const variant =
            product.variants.length > 0
                ? product.variants[selectedVariant[product.id] ?? 0]
                : null;
        const amount = qty[product.id] ?? 1;

        const payload: {
            id_produk: number;
            jumlah_produk: number;
            variant_id?: number;
        } = {
            id_produk: product.id,
            jumlah_produk: amount,
        };
        if (variant) {
            payload.variant_id = variant.id;
        }

        router.post(addToCart(product.id).url, payload, {
            preserveScroll: true,
            onSuccess: () => setQty((prev) => ({ ...prev, [product.id]: 1 })),
            onError: () =>
                alert(
                    'Gagal menambahkan ke keranjang. Silakan login terlebih dahulu.',
                ),
        });
    };

    const pageUrl = (url: string | null) => {
        if (!url) return '#';
        try {
            return new URL(url).pathname + new URL(url).search;
        } catch {
            return url;
        }
    };

    return (
        <>
            <Head title={`${outlet.nama_outlet} | Belanja Online`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <header className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 dark:border-gray-800">
                    <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_70%_10%,rgba(255,255,255,0.25),transparent)] opacity-60" />
                    <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
                        <div className="flex items-center gap-4">
                            {outlet.gambar ? (
                                <img
                                    src={`/${outlet.gambar}`}
                                    alt={outlet.nama_outlet}
                                    className="h-16 w-16 rounded-2xl border border-white/30 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-lg">
                                    <ShoppingBagIcon className="h-8 w-8 text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-white md:text-3xl">
                                    {outlet.nama_outlet}
                                </h1>
                                <p className="mt-0.5 text-sm text-white/85">
                                    {[outlet.alamat_outlet, outlet.kota]
                                        .filter(Boolean)
                                        .join(', ') || 'Toko online resmi'}
                                </p>
                            </div>
                        </div>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-white"
                        >
                            <ShoppingBagIcon className="h-4 w-4" />
                            Masuk untuk Belanja
                        </a>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-6 py-6">
                    <form onSubmit={submitSearch} className="relative mb-6">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari produk di toko ini..."
                            className="w-full rounded-2xl border border-gray-300 bg-white py-3 pr-4 pl-12 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                    </form>

                    {kategoris.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => filterByKategori(0)}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    selectedKategori === 0
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Semua
                            </button>
                            {kategoris.map((kategori) => (
                                <button
                                    key={kategori.id}
                                    type="button"
                                    onClick={() =>
                                        filterByKategori(kategori.id)
                                    }
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                        selectedKategori === kategori.id
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {kategori.kategori}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        {search && (
                            <span>Hasil untuk &quot;{search}&quot; — </span>
                        )}
                        {products.total} produk
                    </div>

                    {products.data.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tidak ada produk yang cocok.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.data.map((product) => {
                                const variant =
                                    product.variants.length > 0
                                        ? product.variants[
                                              selectedVariant[product.id] ?? 0
                                          ]
                                        : null;
                                const variantStock = variant
                                    ? variant.stok
                                    : product.stok;
                                const amount = qty[product.id] ?? 1;
                                const soldOut = variantStock <= 0;

                                return (
                                    <div
                                        key={product.id}
                                        className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        {product.gambar ? (
                                            <img
                                                src={`/${product.gambar}`}
                                                alt={product.nama_produk}
                                                className="h-40 w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                                <ShoppingBagIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                        <div className="flex flex-1 flex-col p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="flex-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {product.nama_produk}
                                                </h3>
                                                {product.stok > 0 &&
                                                    product.min_stok > 0 &&
                                                    product.stok <=
                                                        product.min_stok && (
                                                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                            Stok Menipis
                                                        </span>
                                                    )}
                                            </div>
                                            {product.kategori && (
                                                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                    {product.kategori.kategori}
                                                </p>
                                            )}

                                            {product.variants.length > 0 && (
                                                <select
                                                    value={
                                                        selectedVariant[
                                                            product.id
                                                        ] ?? 0
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedVariant(
                                                            (prev) => ({
                                                                ...prev,
                                                                [product.id]:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            }),
                                                        )
                                                    }
                                                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                                >
                                                    {product.variants.map(
                                                        (v, idx) => (
                                                            <option
                                                                key={v.id}
                                                                value={idx}
                                                            >
                                                                {v.name} —{' '}
                                                                {formatRupiah(
                                                                    v.harga ??
                                                                        product.harga,
                                                                )}
                                                                {v.stok <= 0
                                                                    ? ' (stok kosong)'
                                                                    : ''}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            )}

                                            <div className="mt-auto pt-3">
                                                <div className="flex items-end gap-2">
                                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatRupiah(
                                                            product.display_price,
                                                        )}
                                                    </p>
                                                    {product.harga_diskon !==
                                                        null &&
                                                        product.harga_diskon >
                                                            0 && (
                                                            <p className="text-xs text-gray-400 line-through">
                                                                {formatRupiah(
                                                                    product.harga,
                                                                )}
                                                            </p>
                                                        )}
                                                </div>

                                                {soldOut ? (
                                                    <div className="mt-2 w-full rounded-xl bg-gray-100 px-3 py-2.5 text-center text-xs font-semibold text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                                                        Stok Habis
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-600">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQty(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [product.id]:
                                                                                Math.max(
                                                                                    1,
                                                                                    (prev[
                                                                                        product
                                                                                            .id
                                                                                    ] ??
                                                                                        1) -
                                                                                        1,
                                                                                ),
                                                                        }),
                                                                    )
                                                                }
                                                                className="px-2 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                            >
                                                                <MinusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                                                {amount}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQty(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [product.id]:
                                                                                Math.min(
                                                                                    variantStock,
                                                                                    (prev[
                                                                                        product
                                                                                            .id
                                                                                    ] ??
                                                                                        1) +
                                                                                        1,
                                                                                ),
                                                                        }),
                                                                    )
                                                                }
                                                                className="px-2 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                            >
                                                                <PlusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleAddToCart(
                                                                    product,
                                                                )
                                                            }
                                                            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                                        >
                                                            + Keranjang
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {products.last_page > 1 && (
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-1">
                            {products.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && loadPage(pageUrl(link.url))
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-indigo-600 font-semibold text-white'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                    © {new Date().getFullYear()} {outlet.nama_outlet} — Powered
                    by HUBO
                </footer>
            </div>
        </>
    );
}
