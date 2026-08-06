import { PlusIcon } from '@heroicons/react/24/outline';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, Head, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { kelola_produk as kelolaProdukRoute } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Produk',
        href: kelolaProdukRoute().url,
    },
];

interface Outlet {
    id: number;
    gambar: string;
    nama_outlet: string;
    alamat_outlet: string;
    kota: string;
    telp: string;
}

interface OutletPageProps extends InertiaPageProps {
    outlets: Outlet[];
    jmlOutlet: number;
}

export default function Kelola_Produk() {
    const [error] = useState('');
    const [page] = useState(1);
    const [limit] = useState(10);
    const { outlets: rawOutlets, jmlOutlet } = usePage<OutletPageProps>().props;
    const outlets = rawOutlets ?? [];

    const handleTambahProduk = async (id: number) => {
        router.get(`/produk/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Produk" />
            <main className="max-w-8xl mx-auto p-4 sm:p-6">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl font-bold tracking-tight text-gray-800 sm:text-2xl md:text-3xl dark:text-gray-100">
                        Kelola Produk
                    </h1>
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                        Pilih Outlet dahulu sebelum melakukan Tambah, Edit, atau
                        Hapus Produk.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col items-start justify-between gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-100">
                            Daftar Outlet Saya
                        </h2>
                        <span className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                            Total:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {jmlOutlet}
                            </span>{' '}
                            Outlet
                        </span>
                    </div>

                    {/* Tabel responsif */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="min-w-full align-middle">
                            <table
                                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                                id="tabel_produk"
                            >
                                <thead className="bg-gray-100 dark:bg-gray-700/50">
                                    <tr className="bg-gray-100 dark:bg-gray-700/50">
                                        <th className="w-12 px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:w-20 sm:px-6 sm:py-4 dark:text-gray-300">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:px-6 sm:py-4 dark:text-gray-300">
                                            Avatar
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:px-6 sm:py-4 dark:text-gray-300">
                                            Nama
                                        </th>
                                        <th className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:px-6 sm:py-4 md:table-cell dark:text-gray-300">
                                            Alamat
                                        </th>
                                        <th className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:table-cell sm:px-6 sm:py-4 dark:text-gray-300">
                                            Kota
                                        </th>
                                        <th className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase sm:px-6 sm:py-4 lg:table-cell dark:text-gray-300">
                                            Telp
                                        </th>
                                        <th className="w-28 px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase sm:w-40 sm:px-6 sm:py-4 dark:text-gray-300">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {outlets.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                Belum ada data outlet. Klik
                                                "Tambah Kategori" untuk
                                                menambah.
                                            </td>
                                        </tr>
                                    ) : (
                                        outlets.map((item, nourut) => (
                                            <tr
                                                key={item.id}
                                                className="bg-white transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                                            >
                                                <td className="px-4 py-3 text-xs text-gray-600 tabular-nums sm:px-6 sm:py-4 sm:text-sm dark:text-gray-400">
                                                    {(page - 1) * limit +
                                                        nourut +
                                                        1}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    {item.gambar ? (
                                                        <img
                                                            src={`/${item.gambar}`}
                                                            alt={
                                                                item.nama_outlet
                                                            }
                                                            className="h-12 w-12 rounded-lg object-cover sm:h-20 sm:w-20"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 sm:h-20 sm:w-20 dark:bg-gray-700">
                                                            <span className="text-[10px] text-gray-400 sm:text-xs">
                                                                No Image
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm dark:text-gray-100">
                                                    {item.nama_outlet}
                                                </td>
                                                <td className="hidden px-4 py-3 text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm md:table-cell dark:text-gray-100">
                                                    {item.alamat_outlet}
                                                </td>
                                                <td className="hidden px-4 py-3 text-xs font-medium text-gray-900 sm:table-cell sm:px-6 sm:py-4 sm:text-sm dark:text-gray-100">
                                                    {item.kota}
                                                </td>
                                                <td className="hidden px-4 py-3 text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm lg:table-cell dark:text-gray-100">
                                                    {item.telp}
                                                </td>
                                                <td className="px-4 py-3 text-center sm:px-6 sm:py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleTambahProduk(
                                                                item.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 sm:px-3 sm:text-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                                        title="Detail"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                        <span className="sm:inline">
                                                            Tambah Produk
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
