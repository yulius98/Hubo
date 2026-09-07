import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { homepage, wishlist } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface WishlistProduct {
    id: number;
    nama_produk: string;
    gambar: string | null;
    harga: number;
    stok: number;
    slug: string | null;
    outlet: string | null;
}

interface WishlistPageProps extends InertiaPageProps {
    products: WishlistProduct[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: homepage().url },
    { title: 'Wishlist Saya', href: wishlist().url },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

export default function WishlistPage() {
    const { products } = usePage<WishlistPageProps>().props;

    const remove = (id: number) => {
        router.post(`/produk/${id}/wishlist-toggle`, undefined, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wishlist Saya" />

            <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
                        <Heart className="h-8 w-8 text-rose-500" />
                        Wishlist Saya
                    </h1>
                </div>

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                        <Heart className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                            Wishlist masih kosong. Simpan produk favoritmu dengan
                            menekan ikon hati pada produk.
                        </p>
                        <Link
                            href={homepage()}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                <Link href={`/${product.slug}`}>
                                    <img
                                        src={
                                            product.gambar ||
                                            '/images/placeholder.png'
                                        }
                                        alt={product.nama_produk}
                                        className="h-44 w-full object-cover"
                                    />
                                </Link>
                                <div className="p-4">
                                    <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {product.nama_produk}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                        {product.outlet}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                            {formatRupiah(product.harga)}
                                        </span>
                                        <span
                                            className={`text-xs font-medium ${product.stok > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                                        >
                                            {product.stok > 0
                                                ? 'Tersedia'
                                                : 'Habis'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Link
                                            href={`/${product.slug}`}
                                            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                            Lihat Produk
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => remove(product.id)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-rose-900/30"
                                            title="Hapus dari wishlist"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}