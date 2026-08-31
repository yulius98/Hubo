import {
    ExclamationTriangleIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useCallback, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { kelola_stok as kelolaStokRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Outlet {
    id: number;
    nama_outlet: string;
}

interface ProdukStok {
    id: number;
    id_kategori: number;
    gambar: string | null;
    nama_produk: string;
    harga: number;
    stok: number;
    min_stok: number;
    effective_stok?: number;
    kategori?: { id: number; kategori: string } | null;
}

interface Riwayat {
    id: number;
    tgl_transaksi: string;
    jenis_transaksi: 'IN' | 'OUT';
    jumlah_produk: number;
    keterangan: string | null;
    produk?: { id: number; nama_produk: string } | null;
    user?: { id: number; name: string } | null;
}

interface StokPageProps extends InertiaPageProps {
    outlet: Outlet | null;
    produks: ProdukStok[];
    riwayats: Riwayat[];
    selectedOutletId: number;
}

interface StokFormData {
    id_produk: string;
    jenis_transaksi: 'IN' | 'OUT';
    jumlah_produk: string;
    keterangan: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Stok',
        href: kelolaStokRoute().url,
    },
];

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatTanggal = (value: string): string =>
    new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export default function KelolaStokPage() {
    const { outlet, produks, riwayats, selectedOutletId } =
        usePage<StokPageProps>().props;
    const errors = usePage().props.errors as Record<string, string>;

    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<StokFormData>({
        id_produk: '',
        jenis_transaksi: 'IN',
        jumlah_produk: '',
        keterangan: '',
    });

    const resetForm = useCallback(() => {
        setShowForm(false);
        setFormData({
            id_produk: '',
            jenis_transaksi: 'IN',
            jumlah_produk: '',
            keterangan: '',
        });
        setError('');
    }, []);

    const toggleForm = useCallback(() => {
        if (showForm) {
            resetForm();
        } else {
            setShowForm(true);
        }
    }, [showForm, resetForm]);

    const handleChange = useCallback(
        (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
        ) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
        },
        [],
    );

    const handleCreate = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const dataToSend = {
                id_produk: formData.id_produk,
                jenis_transaksi: formData.jenis_transaksi,
                jumlah_produk: formData.jumlah_produk,
                keterangan: formData.keterangan,
            };

            router.post('kelola_stok', dataToSend, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (err) => {
                    setError(
                        err.jumlah_produk ??
                            err.id_produk ??
                            Object.values(err)[0] ??
                            'Gagal memperbarui stok.',
                    );
                },
            });
        },
        [formData, resetForm],
    );

    const handleDelete = useCallback((riwayat: Riwayat) => {
        if (!globalThis.confirm('Batalkan mutasi stok ini?')) return;

        router.delete(`kelola_stok/${riwayat.id}`, {
            preserveScroll: true,
            preserveState: true,
            onError: (err) => {
                setError(
                    err.jumlah_produk ??
                        Object.values(err)[0] ??
                        'Gagal membatalkan mutasi stok.',
                );
            },
        });
    }, []);

    const stokBadge = (stok: number) => {
        if (stok <= 0) {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    Habis
                </span>
            );
        }

        if (stok <= 5) {
            return (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {stok} tersisa
                </span>
            );
        }

        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                {stok} tersedia
            </span>
        );
    };

    const lowStockItems = useMemo(
        () =>
            produks.filter((item) => {
                const effective = item.effective_stok ?? item.stok;
                return (
                    effective <= 0 ||
                    (item.min_stok > 0 && effective <= item.min_stok)
                );
            }),
        [produks],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Stok" />
            <main className="max-w-8xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-800 md:text-3xl dark:text-gray-100">
                        Kelola Stok
                        {outlet && (
                            <span className="ml-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 align-middle text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {outlet.nama_outlet}
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Tambah atau kurangi stok produk. Setiap mutasi tercatat
                        di riwayat agar stok selalu sinkron.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {!selectedOutletId && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        Menampilkan stok dari semua outlet Anda. Pilih outlet di
                        sidebar untuk melihat stok per outlet.
                    </div>
                )}

                {/* Card: Peringatan Stok Menipis */}
                {lowStockItems.length > 0 && (
                    <div className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/60 shadow-sm dark:border-rose-800/60 dark:bg-rose-900/20">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200 px-5 py-3.5 dark:border-rose-800/60">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-rose-800 dark:text-rose-200">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                Peringatan Stok Menipis
                            </h2>
                            <span className="text-sm text-rose-700 dark:text-rose-300">
                                {lowStockItems.length} produk perlu restock
                            </span>
                        </div>
                        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                            {lowStockItems.map((item) => {
                                const effective =
                                    item.effective_stok ?? item.stok;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 rounded-xl border border-rose-200 bg-white p-3.5 dark:border-rose-800/60 dark:bg-gray-800"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.nama_produk}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                {item.kategori?.kategori ??
                                                    'Tanpa kategori'}{' '}
                                                · Min. stok:{' '}
                                                <span className="font-semibold">
                                                    {item.min_stok}
                                                </span>
                                            </p>
                                        </div>
                                        {stokBadge(effective)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Card: Tambah Mutasi Stok */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Tambah Mutasi Stok
                        </h2>
                        <button
                            type="button"
                            onClick={toggleForm}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            {showForm ? (
                                <>
                                    <XMarkIcon className="h-5 w-5" />
                                    Tutup Form
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-5 w-5" />
                                    Tambah Stok
                                </>
                            )}
                        </button>
                    </div>
                    {showForm && (
                        <form onSubmit={handleCreate} className="p-6 pt-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="id_produk"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Produk{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="id_produk"
                                        name="id_produk"
                                        value={formData.id_produk}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="">Pilih Produk</option>
                                        {produks.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.nama_produk}
                                                {item.kategori
                                                    ? ` (${item.kategori.kategori})`
                                                    : ''}{' '}
                                                - Stok: {item.stok}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_produk && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.id_produk}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="jenis_transaksi"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Jenis Mutasi{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="jenis_transaksi"
                                        name="jenis_transaksi"
                                        value={formData.jenis_transaksi}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="IN">
                                            Masuk (Tambah Stok)
                                        </option>
                                        <option value="OUT">
                                            Keluar (Kurangi Stok)
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="jumlah_produk"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Jumlah{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="jumlah_produk"
                                        name="jumlah_produk"
                                        value={formData.jumlah_produk}
                                        onChange={handleChange}
                                        placeholder="0"
                                        min="1"
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                    {errors.jumlah_produk && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.jumlah_produk}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="keterangan"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Keterangan
                                    </label>
                                    <textarea
                                        id="keterangan"
                                        name="keterangan"
                                        value={formData.keterangan}
                                        onChange={handleChange}
                                        placeholder="Contoh: pembelian dari supplier, koreksi, retur..."
                                        rows={2}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                >
                                    Simpan Mutasi
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Card: Daftar Produk */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Daftar Produk
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {produks.length}
                            </span>{' '}
                            Produk
                        </span>
                    </div>

                    {produks.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            Belum ada produk untuk outlet ini.
                        </div>
                    ) : (
                        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                            {produks.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {item.gambar ? (
                                        <img
                                            src={`/${item.gambar}`}
                                            alt={item.nama_produk}
                                            className="h-12 w-12 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400 dark:border-gray-600 dark:bg-gray-700/40">
                                            No Image
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.nama_produk}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            {item.kategori?.kategori ??
                                                'Tanpa kategori'}{' '}
                                            · {formatRupiah(item.harga)}
                                        </p>
                                    </div>
                                    {stokBadge(item.stok)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Card: Riwayat Mutasi Stok */}
                <div className="mt-6 mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                            Riwayat Mutasi Stok
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {riwayats.length} mutasi terakhir
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        {riwayats.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Belum ada riwayat mutasi stok.
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                                        <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Tanggal
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Produk
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Jenis
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Jumlah
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Keterangan
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Oleh
                                        </th>
                                        <th className="w-16 px-5 py-3 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {riwayats.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                        >
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatTanggal(
                                                    item.tgl_transaksi,
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.produk?.nama_produk ??
                                                    'Produk terhapus'}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {item.jenis_transaksi ===
                                                'IN' ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                        Masuk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                                        Keluar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                                                {item.jumlah_produk}
                                            </td>
                                            <td className="max-w-[14rem] truncate px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {item.keterangan || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                                                {item.user?.name ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(item)
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                    title="Batalkan mutasi"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
